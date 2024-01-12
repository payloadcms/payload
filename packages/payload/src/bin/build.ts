import payload from '..'

export const build = async (): Promise<void> => {
  await payload.init({
    disableDBConnect: true,
    disableOnInit: true,
    local: true,
  })

  await payload.config.admin.bundler.build(payload.config)
}

// when build.js is launched directly
if (module.id === require.main.id) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  build()
}
