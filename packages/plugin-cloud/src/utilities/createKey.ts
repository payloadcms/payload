interface Args {
  collection: string
  filename: string
  identityID: string
}

export const createKey = ({ collection, filename, identityID }: Args): string =>
  `${identityID}/${process.env.PAYLOAD_CLOUD_ENVIRONMENT}/${collection}/${filename}`
