const { buildConfig } = require('@payloadcms/payload/config');
const Todo = require('./collections/Todo');

module.exports = buildConfig({
  serverURL: 'http://localhost:3000',
  collections: [
    Todo
  ],
});
