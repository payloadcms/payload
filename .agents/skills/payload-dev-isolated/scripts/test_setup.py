from pathlib import Path
import socket
import tempfile
import unittest
from unittest.mock import patch

from configure import settings
from ledger import allocate_record, port_available


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'test' / 'hierarchy').mkdir(parents=True)
        (self.root / 'test' / 'hierarchy' / 'config.ts').write_text('export default {}')
        self.row = {'id': 'demo', 'worktree': str(self.root), 'suite': 'hierarchy', 'port': 3200,
                    'database': {'adapter': 'mongodb', 'host': 'localhost', 'port': 27018,
                                 'name': 'payload_demo'}, 'status': 'reserved'}

    def test_settings_require_exact_dedicated_database(self):
        for uri in ['mongodb://localhost:27018/payload', 'mongodb://localhost:27017/payload_demo',
                    'mongodb://remote:27018/payload_demo', 'mongodb://localhost:27018/payload_demo?dbName=payload']:
            with self.assertRaises(ValueError):
                settings(row=self.row, uri=uri)

    def test_restart_settings_disable_seed_and_drop(self):
        config = settings(row=self.row, uri='mongodb://localhost:27018/payload_demo')
        self.assertEqual(config['command'], ['pnpm', 'run', 'dev', 'hierarchy', '--no-seed'])
        self.assertEqual(config['env']['PAYLOAD_DROP_DATABASE'], 'false')
        self.assertEqual(config['env']['MONGODB_URL'], config['env']['DATABASE_URL'])

    def test_rejects_cleaned_and_unsafe_suite(self):
        for changes in [{'status': 'cleaned'}, {'suite': '../other'}, {'host': 'remote'}]:
            with self.assertRaises(ValueError):
                settings(row={**self.row, **changes}, uri='mongodb://localhost:27018/payload_demo')

    def test_real_listener_is_unavailable(self):
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            listener.listen()
            self.assertFalse(port_available(listener.getsockname()[1]))

    def test_allocator_skips_reservations_and_busy_ports(self):
        with patch('ledger.subprocess.run'), patch('ledger.subprocess.check_output', return_value='abc'), \
             patch('ledger.port_available', side_effect=lambda p: p != 3201):
            row = allocate_record(rows=[{'id': 'other', 'status': 'stopped', 'port': 3200}],
                    name='Demo name', worktree=self.root, suite='hierarchy', start_port=3200, end_port=3202)
        self.assertEqual(row['port'], 3202)
        self.assertTrue(row['database']['name'].startswith('payload_demo_name_'))

    def test_allocator_exhaustion(self):
        with patch('ledger.subprocess.run'), patch('ledger.port_available', return_value=False):
            with self.assertRaises(ValueError):
                allocate_record(rows=[], name='demo', worktree=self.root, suite='hierarchy', start_port=3200, end_port=3200)
