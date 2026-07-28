import { createServerFn } from '@tanstack/react-start'

type LoginArgs = {
  email: string
  password: string
}

const loginServerFunction = createServerFn({ method: 'POST' })
  .validator((data: LoginArgs) => data)
  .handler(async ({ data }) => {
    const [{ login }, { default: config }] = await Promise.all([
      import('@payloadcms/tanstack-start/server'),
      import('../config.js'),
    ])

    await login({
      collection: 'users',
      config,
      email: data.email,
      password: data.password,
    })

    return { success: true }
  })

const logoutServerFunction = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ logout }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../config.js'),
  ])

  return logout({ config })
})

const refreshServerFunction = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ refresh }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../config.js'),
  ])

  return refresh({ config })
})

export async function loginFunction(args: LoginArgs) {
  return loginServerFunction({ data: args })
}

export async function logoutFunction() {
  return logoutServerFunction()
}

export async function refreshFunction() {
  return refreshServerFunction()
}
