import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/** Keep report metadata comfortably below Linux's per-environment-string limit. */
export function boundMatchedFiles({ files }) {
  const selected = []
  let bytes = Buffer.byteLength(JSON.stringify({ files: [], omitted: files.length }))

  for (const file of files) {
    const fileBytes = Buffer.byteLength(JSON.stringify(file)) + 1
    if (bytes + fileBytes > 48 * 1024) break
    selected.push(file)
    bytes += fileBytes
  }

  return { files: selected, omitted: files.length - selected.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = JSON.parse(readFileSync(0, 'utf8'))
  const bounded = boundMatchedFiles({ files })
  appendFileSync(process.env.GITHUB_OUTPUT, `files=${JSON.stringify(bounded)}\n`)
}
