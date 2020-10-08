require('isomorphic-fetch');

const server = require('../../demo/server');
const getConfig = require('../../src/utilities/getConfig');
const { email, password } = require('./credentials');

const { serverURL } = getConfig();

const globalSetup = async () => {
  global.PAYLOAD_SERVER = server.start();

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
