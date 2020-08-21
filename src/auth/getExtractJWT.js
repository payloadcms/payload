const parseCookies = require('../utilities/parseCookies');

const getExtractJWT = (config) => (req) => {
  const jwtFromHeader = req.get('Authorization');

  if (jwtFromHeader && jwtFromHeader.indexOf('JWT ') === 0) {
    return jwtFromHeader.replace('JWT ', '');
  }

  const cookies = parseCookies(req);
  const tokenCookieName = `${config.cookiePrefix}-token`;

  if (cookies && cookies[tokenCookieName] && Array.isArray(config.csrf)) {
    const { headers: { origin } = {} } = req;

    if (config.csrf.indexOf(origin) > -1) {
      const token = cookies[tokenCookieName];
      return token;
    }
  }

  return null;
};

module.exports = getExtractJWT;
