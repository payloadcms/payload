// webpack-config-wrapper.cjs
async function loadConfig() {
  // Step 1: rename ./dist/cjs/bundlers/webpack/components.cjs.config.js to ./dist/cjs/bundlers/webpack/components.cjs.config.cjs if not already:
  const fs = require('fs')
  const path = require('path')
  const configPath = path.resolve(__dirname, './dist/cjs/bundlers/webpack/components.cjs.config.js')
  const configPathNew = path.resolve(
    __dirname,
    './dist/cjs/bundlers/webpack/components.cjs.config.cjs',
  )
  if (!fs.existsSync(configPathNew)) {
    fs.renameSync(configPath, configPathNew)
  }

  const config = require('./dist/cjs/bundlers/webpack/components.cjs.config.cjs')
  console.log('config', config)

  return config.default
}

module.exports = loadConfig()
