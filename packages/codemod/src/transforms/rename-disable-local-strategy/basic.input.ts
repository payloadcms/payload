import type { CollectionConfig } from 'payload'

export const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [],
}

export const LegacyDefault: CollectionConfig = {
  slug: 'legacy-default',
  auth: {
    disableLocalStrategy: false,
  },
  fields: [],
}

export const PartialDisable: CollectionConfig = {
  slug: 'partial-disable',
  auth: {
    disableLocalStrategy: {
      enableFields: true,
    },
  },
  fields: [],
}

export const PartialDisableWithOptionalPassword: CollectionConfig = {
  slug: 'partial-disable-optional-password',
  auth: {
    disableLocalStrategy: {
      enableFields: true,
      optionalPassword: true,
    },
  },
  fields: [],
}

export const OptionalPasswordOnly: CollectionConfig = {
  slug: 'optional-password-only',
  auth: {
    disableLocalStrategy: {
      optionalPassword: true,
    },
  },
  fields: [],
}
