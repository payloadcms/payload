import { cookies as getCookies } from 'next/headers.js';
import { generatePayloadCookie } from 'payload';
export async function setPayloadAuthCookie({
  authConfig,
  cookiePrefix,
  token
}) {
  const cookies = await getCookies();
  const cookieExpiration = authConfig.tokenExpiration ? new Date(Date.now() + authConfig.tokenExpiration) : undefined;
  const payloadCookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix,
    expires: cookieExpiration,
    returnCookieAsObject: true,
    token
  });
  if (payloadCookie.value) {
    cookies.set(payloadCookie.name, payloadCookie.value, {
      domain: authConfig.cookies.domain,
      expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
      httpOnly: true,
      sameSite: typeof authConfig.cookies.sameSite === 'string' ? authConfig.cookies.sameSite.toLowerCase() : 'lax',
      secure: authConfig.cookies.secure || false
    });
  }
}
//# sourceMappingURL=setPayloadAuthCookie.js.map