import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('ledger.py')


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.ledger = self.root / 'state.json'

    def command(self, *args):
        code = "import runpy,sys; from pathlib import Path; module=runpy.run_path(sys.argv.pop(1)); path=Path(sys.argv.pop(1)); module['main'](ledger_path=path)"
        return [sys.executable, '-c', code, str(SCRIPT), str(self.ledger), *args]

    def run_cli(self, *args, **kwargs):
        return subprocess.run(self.command(*args),
                              capture_output=True, text=True, **kwargs)

    def record(self, record):
        path = self.root / (record['id'] + '.json')
        path.write_text(json.dumps(record))
        return path

    def put(self, record, success=True):
        result = self.run_cli('upsert', str(self.record(record)))
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return result

    def test_updates_preserve_fields_and_reservations_until_cleaned(self):
        self.put({'id': 'a', 'port': 3301, 'name': 'Example'})
        self.put({'id': 'a', 'status': 'stopped'})
        self.put({'id': 'b', 'port': 3301}, success=False)
        row = json.loads(self.run_cli('show', 'a').stdout)
        self.assertEqual(row['name'], 'Example')
        self.assertEqual(row['port'], 3301)
        self.put({'id': 'a', 'status': 'cleaned'})
        self.put({'id': 'b', 'port': 3301})
        self.assertEqual(len(json.loads(self.run_cli('list', '--json').stdout)['environments']), 2)

    def test_database_alias_and_schema_collisions(self):
        db = {'adapter': 'postgres', 'host': 'localhost', 'name': 'test', 'schema': 'one'}
        self.put({'id': 'a', 'database': db})
        self.put({'id': 'b', 'database': {**db, 'host': '127.0.0.1', 'port': 5432, 'schema': 'two'}}, success=False)

    def test_invalid_record_does_not_change_ledger(self):
        self.put({'id': 'a', 'port': 3301})
        original = self.ledger.read_bytes()
        for patch in [{'id': 'b', 'port': True}, {'id': 'b', 'password': 'secret'},
                      {'id': 'b', 'database': {'adapter': 'mongo', 'host': 'mongodb://user:secret@host', 'name': 'test'}}]:
            self.put(patch, success=False)
            self.assertEqual(original, self.ledger.read_bytes())

    def test_concurrent_writers_preserve_records(self):
        processes = [subprocess.Popen(self.command('upsert', str(self.record({'id': str(i), 'port': 3400 + i}))),
                     stdout=subprocess.PIPE, stderr=subprocess.PIPE) for i in range(8)]
        for process in processes:
            _, err = process.communicate(timeout=30)
            self.assertEqual(process.returncode, 0, err)
        self.assertEqual(len(json.loads(self.ledger.read_text())['environments']), 8)

    def test_concurrent_collision_has_only_one_winner(self):
        processes = [subprocess.Popen(self.command('upsert', str(self.record({'id': str(i), 'port': 3500}))),
                     stdout=subprocess.PIPE, stderr=subprocess.PIPE) for i in range(4)]
        for process in processes:
            process.communicate(timeout=30)
        self.assertEqual(sum(p.returncode == 0 for p in processes), 1)

    def test_missing_list(self):
        result = self.run_cli('list', '--json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['environments'], [])
        self.assertFalse(self.ledger.exists())

    def test_cli_rejects_path_override(self):
        result = subprocess.run([sys.executable, str(SCRIPT), '--ledger', str(self.ledger), 'list'],
                                capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.ledger.exists())

    def test_default_ignores_environment_overrides(self):
        import runpy
        from unittest.mock import patch
        module = runpy.run_path(str(SCRIPT))
        with patch.dict(os.environ, {'PAYLOAD_DEV_LEDGER': str(self.ledger),
                                    'XDG_STATE_HOME': str(self.root), 'LOCALAPPDATA': str(self.root)}):
            self.assertEqual(module['default_path'](), Path.home() / '.local' / 'state' /
                             'payload-dev-isolated' / 'environments.json')

    def test_corrupt_ledger_is_preserved(self):
        self.ledger.write_text('{invalid')
        self.put({'id': 'a'}, success=False)
        self.assertEqual(self.ledger.read_text(), '{invalid')


if __name__ == '__main__':
    unittest.main()
