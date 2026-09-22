export const slug = 'users'

export const publicUsersSlug = 'public-users'

export const apiKeysSlug = 'api-keys'

// An API-key collection the Admin Panel can also open, so UI flows can be tested against it.
export const apiKeyOnlySlug = 'api-key-only'

// Readable only by an api-key authenticated user of apiKeyOnlySlug: no password login can
// reach it, and the rule refuses every other strategy - including the Admin Panel's own
// session. A 200 from it can therefore only mean an API key authenticated.
export const apiKeyProofSlug = 'api-key-proof'

export const apiKeysWithFieldUpdateAccessSlug = 'api-keys-with-field-update-access'

// Fixed keys for the seeded api-key users. API keys are stored as a one-way hash and are
// never readable again, so tests cannot recover a randomly seeded value.
export const seededAPIKeyOne = 'seeded-api-key-one-c8a1f0b7e4d2'

export const seededAPIKeyTwo = 'seeded-api-key-two-9f3b6c2d8e1a'

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
