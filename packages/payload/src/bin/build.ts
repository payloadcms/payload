import payload from '..'
import loadConfig from '../config/load'

export const build = async (): Promise<void> => {
  await payload.init({
    config: loadConfig(),
    disableDBConnect: true,
    disableOnInit: true,
    local: true,
  })
}

// when build.js is launched directly
if (module.id === require.main.id) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  build()
}
