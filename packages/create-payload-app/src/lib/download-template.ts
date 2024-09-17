import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { x } from 'tar'

export async function downloadTemplate({
  name,
  branch,
  projectDir,
}: {
  branch: string
  /**
   * The name of the template to download
   * Must be dir /templates/<name>
   */
  name: string
  projectDir: string
}) {
  const url = `https://codeload.github.com/payloadcms/payload/tar.gz/${branch}`
  const filter = `payload-${branch}/templates/${name}/`
  await pipeline(
    await downloadTarStream(url),
    x({
      cwd: projectDir,
      filter: (p) => p.includes(filter),
      strip: 2 + name.split('/').length,
    }),
  )
}

async function downloadTarStream(url: string) {
  const res = await fetch(url)

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`)
  }

  return Readable.from(res.body as unknown as NodeJS.ReadableStream)
}
