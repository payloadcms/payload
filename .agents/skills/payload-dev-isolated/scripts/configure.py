#!/usr/bin/env python3
"""Prepare private MongoDB startup settings; never starts or seeds a server."""
import argparse
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import parse_qs, urlsplit

from ledger import default_path, ledger_lock, port_available


def settings(*, row, uri):
    db = row.get('database', {})
    if row.get('status') == 'cleaned' or row.get('host', 'local') != 'local':
        raise ValueError('Environment must be active and local')
    if db.get('adapter') != 'mongodb' or not re.fullmatch(r'payload_[a-z0-9_]+', db.get('name', '')):
        raise ValueError('Only dedicated named MongoDB environments are supported')
    parsed = urlsplit(uri)
    if parsed.scheme != 'mongodb' or parsed.fragment or parsed.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Use a single local MongoDB endpoint')
    if db.get('host') not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Ledger must identify a local MongoDB endpoint')
    if (parsed.port or 27017) != db.get('port') or parsed.path != '/' + db['name']:
        raise ValueError('Connection must match the reserved database name and service port')
    if any(k.lower() in ('dbname', 'loadbalanced') for k in parse_qs(parsed.query)):
        raise ValueError('Unsupported connection option')
    port = row.get('port')
    if type(port) is not int or not 1024 <= port <= 65535:
        raise ValueError('Invalid reserved server port')
    root = Path(row['worktree']).resolve(strict=True)
    suite = row['suite']
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', suite) or not (root / 'test' / suite / 'config.ts').is_file():
        raise ValueError('Registered suite is missing or invalid')
    return {'worktree': str(root), 'command': ['pnpm', 'run', 'dev', suite, '--no-seed'],
            'env': {'PORT': str(port), 'PAYLOAD_DATABASE': 'mongodb', 'MONGODB_URL': uri,
                    'DATABASE_URL': uri, 'PAYLOAD_DROP_DATABASE': 'false'}}


def main(*, ledger_path=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('id')
    parser.add_argument('--connection-file', type=Path, required=True,
                        help='Private file containing the exact dedicated MongoDB URI')
    args = parser.parse_args()
    path = default_path() if ledger_path is None else Path(ledger_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with ledger_lock(path):
        rows = json.loads(path.read_text())['environments']
        row = next((r for r in rows if r['id'] == args.id), None)
        if row is None:
            raise ValueError('Unknown environment')
        if not re.fullmatch(r'[a-zA-Z0-9_-]+', args.id):
            raise ValueError('Invalid environment ID')
        config = settings(row=row, uri=args.connection_file.read_text().strip())
        if not port_available(row['port']):
            raise ValueError('Reserved server port is no longer available; do not use another listener')
        folder = path.parent / 'launch-settings'
        folder.mkdir(mode=0o700, exist_ok=True)
        target = folder / (args.id + '.json')
        fd, tmp = tempfile.mkstemp(dir=folder)
        try:
            with os.fdopen(fd, 'w') as stream:
                json.dump(config, stream, indent=2)
                stream.write('\n')
            os.replace(tmp, target)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
        print('Private startup settings: ' + str(target))
        print('URI and port match the reservation. Runtime adapter overrides have NOT been verified.')
        print('No server started; no data seeded. Inspect the effective suite adapter before startup.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError) as exc:
        raise SystemExit(str(exc))
