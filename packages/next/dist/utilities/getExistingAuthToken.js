import { cookies as getCookies } from 'next/headers.js';
export async function getExistingAuthToken(cookiePrefix) {
  const cookies = await getCookies();
  return cookies.getAll().find(cookie => cookie.name.startsWith(cookiePrefix));
}
//# sourceMappingURL=getExistingAuthToken.js.map