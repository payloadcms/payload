import { createServerFn } from '@tanstack/react-start'

const logoutServerFunction = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ logout }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../../config.js'),
  ])

  return logout({ config })
})

export async function logoutFunction() {
  return logoutServerFunction()
}
