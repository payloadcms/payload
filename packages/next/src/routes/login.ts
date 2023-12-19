import { login as loginOperation } from 'payload/operations'
import { createPayloadRequest } from '../createPayloadRequest'
import { SanitizedConfig } from 'payload/types'
import { isNumber } from 'payload/utilities'

export const login = ({ config }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config })
    const collection = req.payload.collections[params.collection]

    const { searchParams } = new URL(request.url)
    const depth = searchParams.get('depth')
    let responseOptions = {
      headers: new Headers(),
    }
    const result = await loginOperation({
      collection,
      data: {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        password: typeof req.data?.password === 'string' ? req.data.password : '',
      },
      depth: isNumber(depth) ? Number(depth) : undefined,
      req,
      responseOptions,
    })

    return Response.json(
      {
        exp: result.exp,
        message: 'Auth Passed',
        token: result.token,
        user: result.user,
      },
      responseOptions,
    )
  }
