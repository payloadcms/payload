import loadConfig from '../config/load'

export const build = async (): Promise<void> => {
  const config = await loadConfig() // Will throw its own error if it fails

  await config.admin.bundler.build(config)
}

// when build.js is launched directly
if (module.id === require.main.id) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  build()
}
