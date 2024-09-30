import type { ImportMap, Payload, SanitizedConfig } from 'payload'

import { buildFormState, type BuildFormStateArgs } from '@payloadcms/ui/utilities/buildFormState'

import { getPayloadHMR } from './getPayloadHMR.js'

type Args = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
} & (
  | {
      action: string
      args: Record<string, unknown>
    }
  | { action: 'form-state'; args: BuildFormStateArgs }
)

const actions = {
  'form-state': buildFormState,
}

export const handleServerActions = async (args: Args): Promise<unknown> => {
  const { action: actionKey, args: fnArgs, config: configPromise, importMap } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  const augmentedArgs: {
    config: SanitizedConfig
    importMap: ImportMap
    payload: Payload
  } & Args['args'] = {
    ...fnArgs,
    config,
    importMap,
    payload,
  }

  const action = actions[actionKey]

  if (!action) {
    throw new Error(`Unknown Server Action: ${actionKey}`)
  }

  return action(augmentedArgs)
}
