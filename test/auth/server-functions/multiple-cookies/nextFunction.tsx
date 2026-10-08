'use server'

import { handleServerFunctions } from '@payloadcms/next/layouts'

import config from '../../config.js'
import {
  multipleCookiesServerFunctionName,
  multipleCookiesServerFunctions,
} from './serverFunction.js'

export async function setMultipleCookiesFunction() {
  await handleServerFunctions({
    name: multipleCookiesServerFunctionName,
    args: {},
    config,
    importMap: {},
    serverFunctions: multipleCookiesServerFunctions,
  })

  return { success: true }
}
