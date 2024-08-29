import jwt from 'jsonwebtoken'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadHMR } from '@payloadcms/next/utilities'
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
  const payload = await getPayloadHMR({ config: configPromise })
  const token = req.cookies.get(payloadToken)?.value
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

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
    draftMode().disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  draftMode().enable()
  redirect(path)
}
