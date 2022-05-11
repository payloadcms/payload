require('isomorphic-fetch');
const { credentials } = require('../integration/common/credentials');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('before:run', () => {
    return fetch('http://localhost:3000/api/admins/first-register', {
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });
  });
};
