import type { BaseServerFunctionArgs } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'

import { getPayloadHMR } from './getPayloadHMR.js'

const defaultFunctions = {
  'form-state': buildFormState,
}

export const handleServerFunctions = async (
  args: {
    args: Parameters<typeof buildFormState>[0]
    name: 'form-state'
  } & BaseServerFunctionArgs,
): Promise<unknown> => {
  const { name: fnKey, args: fnArgs, config: configPromise, importMap } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  const augmentedArgs = {
    ...fnArgs,
    config,
    importMap,
    payload,
  }

  const functions = {
    ...defaultFunctions,
    ...config?.admin?.serverFunctions?.reduce((acc, fnConfig) => {
      acc[fnConfig.name] = fnConfig.function
      return acc
    }, {}),
  }

  const fn = functions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
