import type { PayloadRequestWithData } from 'payload/types'

export const hookedResponse = async (req: PayloadRequestWithData, res: Response) => {
  await req.payload.config.hooks.afterEndpoint.reduce(async (priorHook, hook) => {
    await priorHook

    res = await hook({
      req,
      res,
    })
  }, Promise.resolve())

  return res
}
