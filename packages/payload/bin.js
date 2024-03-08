#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-var-requires */

import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
// import * as tsNode from 'ts-node'

import bin from './dist/bin/index.js'
import { loadEnv } from './dist/bin/loadEnv.js'
import { findConfig } from './dist/config/find.js'

// Allow disabling SWC for debugging
if (process.env.DISABLE_SWC !== 'true') {
  // const oldURL = pathToFileURL('./').toString()
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  register('./dist/bin/register/index.js', url)
}

// tsNode.register({})

const start = async () => {
  loadEnv()
  const configPath = findConfig()

  // const sanitized = configPath.replace('.ts', '')
  const configPromise = await import(configPath)
  const config = await configPromise

  bin(config)
}

start()
