export const slug = 'users'

export const publicUsersSlug = 'public-users'

export const apiKeysSlug = 'api-keys'

export const rotateSecretSlug = 'rotate-secret'

export const rotateSecretLoginSlug = 'rotate-secret-login'

// A previous PAYLOAD_SECRET kept in the keyring (config.previousSecrets) so
// rotation tests can seed and read data encrypted under it.
export const rotateSecretOldSecret = 'old-payload-secret-for-rotation-tests'

export const partialDisableLocalStrategiesSlug = 'partial-disable-local-strategies'

export const namedSaveToJWTValue = 'namedSaveToJWT value'

export const saveToJWTKey = 'x-custom-jwt-property-name'

export const BASE_PATH: '' | `/${string}` = ''
