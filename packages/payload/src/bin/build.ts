import * as url from 'node:url'

import loadConfig from '../config/load.js'

export const build = async (): Promise<void> => {
  const config = await loadConfig() // Will throw its own error if it fails

  await config.admin.bundler.build(config)
}

let isMainModule = false

if (typeof module !== 'undefined' && module) {
  //CJS
  if (module.id === require.main.id) {
    isMainModule = true
  }
} else {
  // ESM
  // This is an ESM translation from Rich Harris https://2ality.com/2022/07/nodejs-esm-main.html
  if (import.meta.url.startsWith('file:')) {
    // (A)
    const modulePath = url.fileURLToPath(import.meta.url)
    if (process.argv[1] === modulePath) {
      isMainModule = true
    }
  }
}

// when the file is launched directly
if (isMainModule) {
  build()
}
