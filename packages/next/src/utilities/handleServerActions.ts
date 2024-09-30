import type { ImportMap, SanitizedConfig } from 'payload'

import { buildFormState, type BuildFormStateArgs } from '@payloadcms/ui/utilities/buildFormState'

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

export const handleServerActions = async (args: Args): Promise<unknown> => {
  const {
    action,
    args: fnArgs,
    defaultArgs: { config: configPromise, importMap },
  } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  // const req = createPayloadRequest({ config })

  const augmentedArgs = {
    ...fnArgs,
    config,
    importMap,
    payload,
  }

  switch (action) {
    case 'form-state': {
      // @ts-expect-error TODO: enable ts `strictNullChecks` for this to properly infer the type
      return buildFormState(augmentedArgs)
    }

    default: {
      console.error(`Unknown Server Action: ${action}`) // eslint-disable-line no-console
    }
  }
}
