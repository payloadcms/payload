import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { payloadToken } from '../../_api/token'

/**
 * The Next.js API routes can conflict with Payload's own routes if they share the same path
 * To avoid this you can customise the path of Payload or the API route of Nextjs as we've done here
 * See readme: https://github.com/payloadcms/payload/tree/main/templates/ecommerce#conflicting-routes
 *  */
export async function GET(
  req: Request & {
    cookies: {
      get: (name: string) => {
        value: string
      }
    }
  },
): Promise<Response> {
  const token = req.cookies.get(payloadToken)?.value
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const secret = searchParams.get('secret')

  if (!url) {
    return new Response('No URL provided', { status: 404 })
  }

  if (!token) {
    new Response('You are not allowed to preview this page', { status: 403 })
  }

  // validate the Payload token
  const userReq = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
  })

  const userRes = await userReq.json()

  if (!userReq.ok || !userRes?.user) {
    draftMode().disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (secret !== process.env.NEXT_PRIVATE_DRAFT_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  draftMode().enable()

  redirect(url)
}
