import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(
  req: {
    cookies: {
      get: (name: string) => {
        value: string
      }
    }
  } & Request,
): Promise<Response> {
  const payloadToken = req.cookies.get('payload-token')?.value
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const secret = searchParams.get('secret')

  if (!url) {
    return new Response('No URL provided', { status: 404 })
  }

  if (!payloadToken) {
    new Response('You are not allowed to preview this page', { status: 403 })
  }

  // validate the Payload token
  const userReq = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/me`, {
    headers: {
      Authorization: `JWT ${payloadToken}`,
    },
  })

  const userRes = await userReq.json()

  const draft = await draftMode()

  if (!userReq.ok || !userRes?.user) {
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (secret !== process.env.NEXT_PRIVATE_DRAFT_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  draft.enable()

  redirect(url)
}
