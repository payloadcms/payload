#!/usr/bin/env node

import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Allow disabling SWC for debugging
if (process.env.DISABLE_SWC !== 'true') {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  register('./dist/bin/loader/index.js', url)
}

const start = async () => {
  const { bin } = await import('./dist/bin/index.js')
  bin()
}

void start()
