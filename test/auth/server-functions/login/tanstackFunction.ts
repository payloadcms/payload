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
      import('../../config.js'),
    ])

    await login({
      collection: 'users',
      config,
      email: data.email,
      password: data.password,
    })

    return { success: true }
  })

export async function loginFunction(args: LoginArgs) {
  return loginServerFunction({ data: args })
}
