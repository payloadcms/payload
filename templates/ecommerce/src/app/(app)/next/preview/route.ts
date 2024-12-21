import jwt from 'jsonwebtoken'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const payloadToken = 'payload-token'

export async function GET(
  req: Request & {
    cookies: {
      get: (name: string) => {
        value: string
      }
    }
  },
): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const token = req.cookies.get(payloadToken)?.value
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const { disable, enable } = await draftMode()

  if (!path) {
    return new Response('No path provided', { status: 404 })
  }

  if (!token) {
    new Response('You are not allowed to preview this page', { status: 403 })
  }

  let user

  try {
    user = jwt.verify(token, payload.secret)
  } catch (error) {
    payload.logger.error('Error verifying token for live preview:', error)
  }

  // You can add additional checks here to see if the user is allowed to preview this page
  if (!user) {
    disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  enable()
  redirect(path)
}
