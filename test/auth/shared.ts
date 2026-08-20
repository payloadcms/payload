export const slug = 'users'

export const publicUsersSlug = 'public-users'

export const openUpdateAuthSlug = 'open-update-auth'

export const collisionAuthASlug = 'collision-auth-a'

export const collisionAuthBSlug = 'collision-auth-b'

export const defaultAccessFixtureSlug = 'default-access-fixture'

export const apiKeysSlug = 'api-keys'

export const rotateSecretSlug = 'rotate-secret'

export const rotateSecretLoginSlug = 'rotate-secret-login'

// A second api-key collection so rotation tests can control processing order via
// collection order (rotateSecret drains collections in the order passed),
// independent of primary-key type - integer ids order by creation, UUIDs do not.
export const rotateSecretSecondarySlug = 'rotate-secret-secondary'

// A previous PAYLOAD_SECRET kept in the keyring (config.previousSecrets) so
// rotation tests can seed and read data encrypted under it.
export const rotateSecretOldSecret = 'old-payload-secret-for-rotation-tests'

export const partialDisableLocalStrategiesSlug = 'partial-disable-local-strategies'

export const namedSaveToJWTValue = 'namedSaveToJWT value'

export const saveToJWTKey = 'x-custom-jwt-property-name'

export const BASE_PATH: '' | `/${string}` = ''
