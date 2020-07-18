const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../../errors');

const login = async (args) => {
  // Await validation here

  const options = { ...args };

  // /////////////////////////////////////
  // 1. Execute before login hook
  // /////////////////////////////////////

  args.collection.config.hooks.beforeLogin.forEach((hook) => hook({ req: args.req }));

  // /////////////////////////////////////
  // 2. Perform login
  // /////////////////////////////////////

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    config,
    data,
  } = options;

  const { email, password } = data;

  const user = await Model.findByUsername(email);

  if (!user) throw new AuthenticationError();

  const authResult = await user.authenticate(password);

  if (!authResult.user) {
    throw new AuthenticationError();
  }

  const fieldsToSign = collectionConfig.fields.reduce((signedFields, field) => {
    if (field.saveToJWT) {
      return {
        ...signedFields,
        [field.name]: user[field.name],
      };
    }
    return signedFields;
  }, {
    email,
    id: user.id,
  });

  fieldsToSign.collection = collectionConfig.slug;

  const token = jwt.sign(
    fieldsToSign,
    config.secret,
    {
      expiresIn: collectionConfig.auth.tokenExpiration,
    },
  );

  if (args.res) {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
    };

    if (collectionConfig.auth.secureCookie) {
      cookieOptions.secure = true;
    }

    if (args.req.headers.origin && args.req.headers.origin.indexOf('localhost') === -1) {
      let domain = args.req.headers.origin.replace('https://', '');
      domain = args.req.headers.origin.replace('http://', '');
      cookieOptions.domain = domain;
    }

    args.res.cookie(`${config.cookiePrefix}-token`, token, cookieOptions);
  }

  // /////////////////////////////////////
  // 3. Execute after login hook
  // /////////////////////////////////////

  args.collection.config.hooks.afterLogin.forEach((hook) => hook({ token, user, req: args.req }));

  // /////////////////////////////////////
  // 4. Return token
  // /////////////////////////////////////

  return token;
};

module.exports = login;
