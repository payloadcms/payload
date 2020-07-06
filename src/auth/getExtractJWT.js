const parseCookies = require('../utilities/parseCookies');

const getExtractJWT = config => (req) => {
  const jwtFromHeader = req.get('Authorization');

  if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
    return jwtFromHeader.replace('JWT ', '');
  }

  const cookies = parseCookies(req);
  const tokenCookieName = `${config.cookiePrefix}-token`;

  if (cookies && cookies[tokenCookieName]) {
    const token = cookies[tokenCookieName];
    return token;
  }

  return null;
};

module.exports = getExtractJWT;
