import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { x } from 'tar'

import type { ProjectTemplate } from '../types.js'

import { debug as debugLog } from '../utils/log.js'

export async function downloadTemplate({
  debug,
  projectDir,
  template,
}: {
  debug?: boolean
  projectDir: string
  template: ProjectTemplate
}) {
  const branchOrTag = template.url.split('#')?.[1] || 'latest'
  const url = `https://codeload.github.com/payloadcms/payload/tar.gz/${branchOrTag}`
  const filter = `payload-${branchOrTag.replace(/^v/, '')}/templates/${template.name}/`

  if (debug) {
    debugLog(`Using template url: ${template.url}`)
    debugLog(`Codeload url: ${url}`)
    debugLog(`Filter: ${filter}`)
  }

  await pipeline(
    await downloadTarStream(url),
    x({
      cwd: projectDir,
      filter: (p) => p.includes(filter),
      strip: 2 + template.name.split('/').length,
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
