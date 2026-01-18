export const getRequestLanguage = ({
  cookies,
  defaultLanguage = 'en',
  headers
}) => {
  const acceptLanguage = headers.get('Accept-Language');
  const cookieLanguage = cookies.get('lng');
  return acceptLanguage || (typeof cookieLanguage === 'string' ? cookieLanguage : cookieLanguage.value) || defaultLanguage;
};
//# sourceMappingURL=getRequestLanguage.js.map