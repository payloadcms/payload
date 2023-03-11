interface Args {
  collection: string
  identityID: string
  filename: string
}

export const createKey = ({ collection, identityID, filename }: Args): string =>
  `${identityID}/${process.env.PAYLOAD_CLOUD_ENVIRONMENT}/${collection}/${filename}`
