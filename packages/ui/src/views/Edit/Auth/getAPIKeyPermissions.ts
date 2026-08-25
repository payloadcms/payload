import type { SanitizedDocumentPermissions } from 'payload'

export const getAPIKeyPermissions = ({
  fields,
  operation,
}: {
  fields: SanitizedDocumentPermissions['fields']
  operation: 'create' | 'update'
}) => {
  if (fields === true) {
    return {
      canModifyAPIKey: true,
      canModifyAPIKeyStatus: true,
      canReadAPIKey: true,
      canReadAPIKeyStatus: true,
    }
  }

  const apiKeyPermissions = fields?.apiKey
  const apiKeyStatusPermissions = fields?.enableAPIKey

  return {
    canModifyAPIKey: apiKeyPermissions === true || apiKeyPermissions?.[operation] === true,
    canModifyAPIKeyStatus:
      apiKeyStatusPermissions === true || apiKeyStatusPermissions?.[operation] === true,
    canReadAPIKey: apiKeyPermissions === true || apiKeyPermissions?.read === true,
    canReadAPIKeyStatus: apiKeyStatusPermissions === true || apiKeyStatusPermissions?.read === true,
  }
}
