import type { Payload } from '../payload'

async function initAdmin(ctx: Payload): Promise<void> {
  if (!ctx.config.admin.disable) {
    if (process.env.NODE_ENV === 'production') {
      ctx.express.use(ctx.config.routes.admin, await ctx.config.admin.bundler.serve(ctx))
    } else {
      ctx.express.use(ctx.config.routes.admin, await ctx.config.admin.bundler.dev(ctx))
    }
  }
}

export default initAdmin
