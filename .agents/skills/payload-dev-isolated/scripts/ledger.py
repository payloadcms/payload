#!/usr/bin/env python3
"""Maintain isolated Payload environment records; never stop servers or delete data."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import socket
import uuid
import re
import subprocess
from datetime import datetime, timezone
from contextlib import contextmanager

def default_path():
    return Path.home() / '.local' / 'state' / 'payload-dev-isolated' / 'environments.json'


@contextmanager
def ledger_lock(path):
    # Use a stable sidecar: replacing the JSON must not replace the locked inode.
    with open(str(path) + '.lock', 'a+b') as lock:
        if os.name == 'nt':
            import msvcrt
            lock.seek(0, os.SEEK_END)
            if lock.tell() == 0:
                lock.write(b'\0')
                lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            yield
        finally:
            if os.name == 'nt':
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock, fcntl.LOCK_UN)


def database_key(db):
    if not db:
        return None
    if db.get('path'):
        return ('file', os.path.normcase(str(Path(db['path']).resolve())))
    adapter = db.get('adapter')
    host = db.get('host', '').lower()
    if host in ('localhost', '127.0.0.1', '::1'):
        host = 'loopback'
    port = db.get('port', {'mongodb': 27017, 'postgres': 5432}.get(adapter))
    # Reserve the entire database, even when an environment uses a schema.
    return (adapter, host, port, db.get('name'))
FIELDS = {'id', 'name', 'thread_id', 'pending_thread_id', 'host', 'repo', 'worktree',
          'branch', 'revision', 'suite', 'port', 'database', 'status', 'pid',
          'process_started_at', 'restart_command', 'seed_status', 'verified_at',
          'notes', 'created_at', 'updated_at'}
STATUSES = {'reserved', 'configured', 'running', 'stopped', 'unknown', 'cleaned'}


def port_available(port):
    sockets = []
    try:
        for family, address in [(socket.AF_INET, '0.0.0.0'), (socket.AF_INET6, '::')]:
            if family == socket.AF_INET6 and not socket.has_ipv6:
                continue
            sock = socket.socket(family, socket.SOCK_STREAM)
            sockets.append(sock)
            if family == socket.AF_INET6:
                sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
            sock.bind((address, port))
        return True
    except OSError:
        return False
    finally:
        for sock in sockets:
            sock.close()


def allocate_record(*, rows, name, worktree, suite, start_port, end_port):
    root = Path(worktree).resolve(strict=True)
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', suite):
        raise ValueError('Use a test suite directory name, without paths or flags')
    if not (root / 'test' / suite / 'config.ts').is_file():
        raise ValueError('Suite config.ts does not exist in this checkout')
    subprocess.run(['git', '-C', str(root), 'rev-parse', '--show-toplevel'],
                   check=True, capture_output=True)
    for row in rows:
        if row.get('status') != 'cleaned' and row.get('worktree') == str(root):
            raise ValueError('Worktree already assigned to ' + row['id'])
    if not 1024 <= start_port <= end_port <= 65535:
        raise ValueError('Invalid port range')
    reserved = {r.get('port') for r in rows if r.get('status') != 'cleaned' and r.get('host', 'local') == 'local'}
    port = next((p for p in range(start_port, end_port + 1) if p not in reserved and port_available(p)), None)
    if port is None:
        raise ValueError('No available unreserved port in range')
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:24] or 'dev'
    identifier = slug + '-' + uuid.uuid4().hex[:12]
    return {'id': identifier, 'name': name, 'host': 'local', 'worktree': str(root),
            'suite': suite, 'port': port, 'status': 'reserved',
            'revision': subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip(),
            'database': {'adapter': 'mongodb', 'host': 'localhost', 'port': 27018,
                         'name': 'payload_' + identifier.replace('-', '_')}}


def main(*, ledger_path=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    ls = sub.add_parser('list')
    ls.add_argument('--json', action='store_true')
    up = sub.add_parser('upsert')
    up.add_argument('file', type=Path, help='JSON object containing id and changed fields')
    show = sub.add_parser('show')
    show.add_argument('id')
    allocate = sub.add_parser('allocate', help='Atomically reserve a local MongoDB environment')
    allocate.add_argument('--name', required=True)
    allocate.add_argument('--worktree', type=Path, required=True)
    allocate.add_argument('--suite', required=True)
    allocate.add_argument('--start-port', type=int, default=3100)
    allocate.add_argument('--end-port', type=int, default=3999)
    status = sub.add_parser('status', help='Report live port availability without trusting recorded state')
    status.add_argument('id')
    args = parser.parse_args()
    path = default_path() if ledger_path is None else Path(ledger_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with ledger_lock(path):
        data = json.loads(path.read_text()) if path.exists() else {'version': 1, 'environments': []}
        if not isinstance(data, dict) or data.get('version') != 1:
            raise ValueError('Unsupported ledger version')
        rows = data.get('environments')
        if not isinstance(rows, list) or any(not isinstance(r, dict) or not isinstance(r.get('id'), str) for r in rows):
            raise ValueError('Invalid environment records')
        if len({r['id'] for r in rows}) != len(rows):
            raise ValueError('Duplicate environment IDs')
        if args.command in ('upsert', 'allocate'):
            patch = (allocate_record(rows=rows, name=args.name, worktree=args.worktree,
                     suite=args.suite, start_port=args.start_port, end_port=args.end_port)
                     if args.command == 'allocate' else json.loads(args.file.read_text()))
            if not isinstance(patch, dict) or not isinstance(patch.get('id'), str) or not patch['id']:
                raise ValueError('A nonempty string id is required')
            if set(patch) - FIELDS:
                raise ValueError('Unknown fields: ' + ', '.join(sorted(set(patch) - FIELDS)))
            old = next((r for r in rows if r['id'] == patch['id']), None)
            row = {**(old or {}), **patch}
            row.setdefault('host', 'local')
            row.setdefault('status', 'reserved')
            if row['status'] not in STATUSES:
                raise ValueError('Invalid status')
            port = row.get('port')
            if port is not None and (type(port) is not int or not 1024 <= port <= 65535):
                raise ValueError('port must be an integer from 1024 to 65535')
            db = row.get('database')
            if db is not None:
                if not isinstance(db, dict) or set(db) - {'adapter', 'host', 'port', 'name', 'schema', 'path'}:
                    raise ValueError('database must contain only adapter, host, port, name, schema, path')
                if not db.get('adapter') or not (db.get('path') or (db.get('name') and db.get('host'))):
                    raise ValueError('database requires adapter and either absolute path or host/name')
                if db.get('path') and not Path(db['path']).is_absolute():
                    raise ValueError('SQLite path must be absolute')
                if any('://' in str(v) or '@' in str(v) for v in db.values()):
                    raise ValueError('Store credential-free database identity, never a connection URI')
            if row['status'] != 'cleaned':
                for other in rows:
                    if other['id'] == row['id'] or other.get('status') == 'cleaned':
                        continue
                    if port is not None and other.get('host', 'local') == row['host'] and other.get('port') == port:
                        raise ValueError('Port already reserved by ' + other['id'])
                    if db and other.get('host', 'local') == row['host'] and database_key(other.get('database')) == database_key(db):
                        raise ValueError('Database already reserved by ' + other['id'])
            now = datetime.now(timezone.utc).isoformat()
            row['created_at'] = (old or {}).get('created_at', now)
            row['updated_at'] = now
            data['environments'] = [r for r in rows if r['id'] != row['id']] + [row]
            fd, tmp = tempfile.mkstemp(dir=path.parent, prefix='.ledger-')
            try:
                with os.fdopen(fd, 'w') as stream:
                    json.dump(data, stream, indent=2)
                    stream.write('\n')
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(tmp, path)
            finally:
                if os.path.exists(tmp):
                    os.unlink(tmp)
            print(row['id'])
        elif args.command in ('show', 'status'):
            row = next((r for r in rows if r['id'] == args.id), None)
            if row is None:
                raise ValueError('Unknown environment: ' + args.id)
            if args.command == 'status':
                port = row.get('port')
                row = {**row, 'port_observation': ('available' if port_available(port) else 'occupied or unavailable') if port else 'unassigned',
                       'ownership_verified': False}
            print(json.dumps(row, indent=2))
        elif args.json:
            print(json.dumps(data, indent=2))
        else:
            print('ID\tSTATUS (recorded)\tPORT\tDATABASE\tWORKTREE')
            for row in rows:
                db = row.get('database') or {}
                print('\t'.join(str(v) for v in [row['id'], row.get('status', 'unknown'),
                    row.get('port', ''), db.get('path') or db.get('name', ''), row.get('worktree', '')]))
            if not rows:
                print('(No environments registered)')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as exc:
        raise SystemExit(str(exc))
