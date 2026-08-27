import { decodeJwt, decodeProtectedHeader } from 'jose'
import { describe, expect, it } from 'vitest'

import { jwtSign } from './jwt.js'
import { JWT_AUTH_VERSION } from './jwtAuth.js'

describe('jwtSign', () => {
  it('should add the JWT format version to the signed protected header without changing the payload', async () => {
    const { token } = await jwtSign({
      fieldsToSign: {
        collection: 'users',
        id: 'user-id',
      },
      secret: '01234567890123456789012345678901',
      tokenExpiration: 3600,
    })

    expect(decodeProtectedHeader(token)).toMatchObject({
      alg: 'HS256',
      authVersion: JWT_AUTH_VERSION,
      typ: 'JWT',
    })
    expect(decodeJwt(token)).not.toHaveProperty('authVersion')
  })
})
