/**
 * Version of Payload's JWT authentication format, stored in the signed protected header.
 *
 * The signer, verifier, and external validators must agree on this value. A mismatch
 * rejects every token in the system, so they should import it rather than repeat the literal.
 */
export const JWT_AUTH_VERSION = 1

export type JWTAuthVersion = typeof JWT_AUTH_VERSION
