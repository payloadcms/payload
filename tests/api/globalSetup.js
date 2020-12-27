require('isomorphic-fetch');
require('../../demo/server');

const loadConfig = require('../../src/config/load').default;
const { email, password } = require('./credentials');

const { serverURL } = loadConfig();

const globalSetup = async () => {
  const response = await fetch(`${serverURL}/api/admins/first-register`, {
    body: JSON.stringify({
      email,
      password,
      roles: ['admin', 'user'],
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'post',
  });

  const data = await response.json();

  if (!data.user || !data.user.token) {
    throw new Error('Failed to register first user');
  }
};

module.exports = globalSetup;
