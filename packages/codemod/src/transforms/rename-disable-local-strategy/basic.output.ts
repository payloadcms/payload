import type { CollectionConfig } from 'payload'

export const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  auth: {
    localStrategy: false,
    useAPIKey: true,
  },
  fields: [],
}

export const LegacyDefault: CollectionConfig = {
  slug: 'legacy-default',
  auth: {},
  fields: [],
}

export const PartialDisable: CollectionConfig = {
  slug: 'partial-disable',
  auth: {
    localStrategy: { enabled: false, disableFields: false },
  },
  fields: [],
}

export const PartialDisableWithOptionalPassword: CollectionConfig = {
  slug: 'partial-disable-optional-password',
  auth: {
    localStrategy: { enabled: false, disableFields: false, optionalPassword: true },
  },
  fields: [],
}

export const OptionalPasswordOnly: CollectionConfig = {
  slug: 'optional-password-only',
  auth: {
    localStrategy: { enabled: false, optionalPassword: true },
  },
  fields: [],
}
