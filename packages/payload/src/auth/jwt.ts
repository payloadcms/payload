import { SignJWT } from 'jose'

export const jwtSign = async ({
  fieldsToSign,
  secret,
  tokenExpiration,
}: {
  fieldsToSign: Record<string, unknown>
  secret: string
  tokenExpiration: number
}) => {
  const secretKey = new TextEncoder().encode(secret)
  const issuedAt = Math.floor(Date.now() / 1000)
  const exp = issuedAt + tokenExpiration
  const token = await new SignJWT(fieldsToSign)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(issuedAt)
    .setExpirationTime(exp)
    .sign(secretKey)
  return { exp, token }
}
