const getExtractJWT = config => (req) => {
  const jwtFromHeader = req.get('Authorization');

  if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
    return jwtFromHeader.replace('JWT ', '');
  }

  if (req.cookies) {
    const jwt = req.cookies[`${config.cookiePrefix}-token`];

    if (jwt) {
      return jwt;
    }
  }

  return null;
};

module.exports = getExtractJWT;
