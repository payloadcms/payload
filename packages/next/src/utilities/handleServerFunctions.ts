import type { BaseServerFunctionArgs } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'

import { getPayloadHMR } from './getPayloadHMR.js'

type Args = {
  args: Parameters<typeof buildFormState>[0]
  name: 'form-state'
} & BaseServerFunctionArgs

const functions = {
  'form-state': buildFormState,
}

export const handleServerFunctions = async (args: Args): Promise<unknown> => {
  const { name: fnKey, args: fnArgs, config: configPromise, importMap } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  const augmentedArgs: Args['args'] & BaseServerFunctionArgs = {
    ...fnArgs,
    config,
    importMap,
    payload,
  }

  const fn = functions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
