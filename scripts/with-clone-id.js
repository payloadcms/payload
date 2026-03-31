import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

// 1. Resolve clone ID
const cloneId = process.env.PAYLOAD_CLONE_ID || path.basename(process.cwd())

// 2. Sanitize for use as a database name
//    - lowercase
//    - replace non-alphanumeric with _
//    - strip leading underscores/numbers (Postgres requires letter start)
//    - truncate to 63 chars (Postgres identifier limit)
//    - fall back to 'payload' if empty
let dbName = cloneId
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '_')
  .replace(/^[_0-9]+/, '')
  .slice(0, 63)

if (!dbName) {
  dbName = 'payload'
  console.warn(
    `\x1b[33m⚠ Clone ID "${cloneId}" sanitized to empty string. Falling back to DB name "payload".\n  Set PAYLOAD_CLONE_ID to a name starting with a letter.\x1b[0m`,
  )
}

// 3. Warn on risky names
const riskyNames = ['postgres', 'admin', 'local', 'config', 'test', 'template0', 'template1']
if (riskyNames.includes(dbName) || dbName.length < 3) {
  console.warn(
    `\x1b[33m⚠ DB name "${dbName}" may collide with a system database.\n  Consider renaming your folder or setting PAYLOAD_CLONE_ID.\x1b[0m`,
  )
}

if (/[^a-zA-Z0-9-]/.test(cloneId)) {
  console.warn(
    `\x1b[33m⚠ Clone ID "${cloneId}" contains characters that may be invalid in hostnames.\n  Consider setting PAYLOAD_CLONE_ID to a value using only letters, numbers, and hyphens.\x1b[0m`,
  )
}

// 4. Build enriched environment
const env = {
  ...process.env,
  PAYLOAD_CLONE_ID: cloneId,
  PAYLOAD_DB_NAME: dbName,
}

// 5. Build command args — inject --name after portless
const args = process.argv.slice(2)
if (args[0] === 'portless') {
  args.splice(1, 0, '--name', cloneId)
}

// 6. Determine the DB URL for logging
const dbAdapter = process.env.PAYLOAD_DATABASE || 'mongodb'
const dbUrlMap = {
  mongodb: `mongodb://payload:payload@localhost:27018/${dbName}?authSource=admin&directConnection=true&replicaSet=rs0`,
  'mongodb-atlas': `mongodb://localhost:27019/${dbName}?directConnection=true&replicaSet=mongodb-atlas-local`,
  postgres: `postgres://payload:payload@127.0.0.1:5433/${dbName}`,
  sqlite: `file:./${dbName}.db`,
}
const dbUrl = dbUrlMap[dbAdapter] || `(${dbAdapter} — see adapter config)`

// 7. Log startup summary
const portlessUrl = `http://${cloneId}.localhost:1355`
console.log(
  [
    '',
    '┌─────────────────────────────────────────────────────',
    `│ Clone ID:    ${cloneId}`,
    `│ Server URL:  ${portlessUrl}`,
    `│ DB name:     ${dbName}`,
    `│ DB URL:      ${dbUrl}`,
    '└─────────────────────────────────────────────────────',
    '',
  ].join('\n'),
)

// 8. Spawn child process
if (!args[0]) {
  console.error('Usage: node scripts/with-clone-id.js <command> [args...]')
  process.exit(1)
}

const isWindows = os.platform() === 'win32'
const cmd = isWindows && !args[0].endsWith('.cmd') ? args[0] + '.cmd' : args[0]
const child = spawn(cmd, args.slice(1), {
  env,
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

child.on('error', (err) => {
  console.error(`\x1b[31mFailed to start child process: ${err.message}\x1b[0m`)
  process.exit(1)
})
