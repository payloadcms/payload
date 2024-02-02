const { bootAdminPanel } = require('./helpers/bootAdminPanel.ts')

bootAdminPanel({
  appDir: __dirname,
  port: 3000,
})
