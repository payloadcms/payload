#!/usr/bin/env node

import { main } from '../dist/cli.js'

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
