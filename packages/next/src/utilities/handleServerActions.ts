import type { ImportMap, Payload, SanitizedConfig, User } from 'payload'

import { buildFormState, type BuildFormStateArgs } from '@payloadcms/ui/utilities/buildFormState'
import { headers } from 'next/headers.js'

import { getPayloadHMR } from './getPayloadHMR.js'

type Args = {
  defaultArgs: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    importMap: ImportMap
  }
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
  const {
    action: actionKey,
    args: fnArgs,
    defaultArgs: { config: configPromise, importMap },
  } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  const { user } = await payload.auth({ headers: headers() })

  // const req = createPayloadRequest({ config })

  const augmentedArgs: {
    payload: Payload
    user: User
  } & Args['defaultArgs'] = {
    ...fnArgs,
    config,
    importMap,
    payload,
    user,
  }

  const action = actions[actionKey]

  if (!action) {
    throw new Error(`Unknown Server Action: ${actionKey}`)
  }

  return action(augmentedArgs)
}
