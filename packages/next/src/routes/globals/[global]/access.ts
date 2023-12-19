import type { SanitizedConfig } from 'payload/types'
import { createPayloadRequest } from '../../../createPayloadRequest'
import { docAccess } from 'payload/dist/globals/operations/docAccess'

export const access = ({ config }: { config: Promise<SanitizedConfig>; global?: string }) =>
  async function (request: Request, { params }: { params: { global: string } }) {
    const req = await createPayloadRequest({ request, config })
    const globalConfig = await config.then((res) =>
      res.globals.find((global) => global.slug === params.global),
    )
    const accessRes = await docAccess({ req, globalConfig })
    return Response.json(accessRes)
  }
