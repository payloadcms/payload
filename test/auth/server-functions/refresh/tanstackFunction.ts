import { createServerFn } from '@tanstack/react-start'

const refreshServerFunction = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ refresh }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../../config.js'),
  ])

  return refresh({ config })
})

export async function refreshFunction() {
  return refreshServerFunction()
}
