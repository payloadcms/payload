require('isomorphic-fetch');
const server = require('../../demo/server');
const config = require('../../demo/payload.config');
const { email, password } = require('./credentials');

const url = config.serverURL;

const globalSetup = async () => {
  global.PAYLOAD_SERVER = server.start();

  const response = await fetch(`${url}/api/users/first-register`, {
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

  if (!data.token) {
    throw new Error('Failed to register first user');
  }
};

module.exports = globalSetup;
