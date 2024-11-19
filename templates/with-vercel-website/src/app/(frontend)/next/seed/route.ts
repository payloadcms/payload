import jwt from 'jsonwebtoken'
import { createLocalReq, getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'

const payloadToken = 'payload-token'
export const maxDuration = 60 // This function can run for a maximum of 60 seconds

export async function POST(
  req: Request & {
    cookies: {
      get: (name: string) => {
        value: string
      }
    }
  },
): Promise<Response> {
  const payload = await getPayload({ config })
  const token = req.cookies.get(payloadToken)?.value

  let user

  try {
    user = jwt.verify(token, payload.secret)
  } catch (error) {
    payload.logger.error('Error verifying token for live preview:', error)
  }

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Create a Payload request object to pass to the Local API for transactions
    // At this point you should pass in a user, locale, and any other context you need for the Local API
    const payloadReq = await createLocalReq({ user }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch {
    return new Response('Error seeding data.')
  }
}
