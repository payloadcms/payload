const { bootAdminPanel } = require('../../test/helpers/bootAdminPanel.ts')

bootAdminPanel({
  appDir: __dirname,
  port: 3000,
})
