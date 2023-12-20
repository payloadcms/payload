import type { SanitizedConfig } from 'payload/types'
import { createPayloadRequest } from '../../createPayloadRequest'
import { docAccess } from 'payload/dist/collections/operations/docAccess'

export const access = ({ config }: { config: Promise<SanitizedConfig>; collection?: string }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config })
    const collectionConfig = await config.then((config) =>
      config.collections.find((collection) => collection.slug === params.collection),
    )
    const accessRes = await docAccess({
      id: params.collection,
      req: {
        ...req,
        collection: {
          config: collectionConfig,
        },
      },
    })

    return Response.json(accessRes)
  }
