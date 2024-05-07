#!/usr/bin/env node

import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { bin } from './dist/bin/index.js'

// Allow disabling SWC for debugging
if (process.env.DISABLE_SWC !== 'true') {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  register('./dist/bin/loader/index.js', url)
}

bin()
