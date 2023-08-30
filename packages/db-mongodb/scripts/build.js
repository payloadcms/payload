import fs from 'fs'
import path from 'path'

const _dirname = path.dirname(new URL(import.meta.url).pathname)

function run() {
  // Create package.json with entry { "type": "commonjs" } in /dist/cjs
  fs.writeFileSync(
    path.join(_dirname, '../dist/cjs/package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
  )

  // Create package.json with entry { "type": "commonjs" } in /dist/esm
  fs.writeFileSync(
    path.join(_dirname, '../dist/esm/package.json'),
    JSON.stringify({ type: 'module' }, null, 2),
  )
}

run()
