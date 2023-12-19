import httpStatus from 'http-status'
import { registerFirstUser as registerFirstUserOperation } from 'payload/operations'
import { createPayloadRequest } from '../createPayloadRequest'
import { SanitizedConfig } from 'payload/types'

export const registerFirstUser = ({ config }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config })
    const collection = req.payload.collections[params.collection]

    let responseOptions = {
      headers: new Headers(),
      status: httpStatus.OK,
    }
    const firstUser = await registerFirstUserOperation({
      collection,
      data: {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        password: typeof req.data?.password === 'string' ? req.data.password : '',
      },
      req,
      responseOptions,
    })

    return Response.json(firstUser, responseOptions)
  }
