import jwt from 'jsonwebtoken'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CollectionSlug, TypedLocale } from 'payload'

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
  const collection = searchParams.get('collection') as CollectionSlug
  const slug = searchParams.get('slug')

  const previewSecret = searchParams.get('previewSecret')

  if (previewSecret) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  } else {
    if (!path) {
      return new Response('No path provided', { status: 404 })
    }

    if (!collection) {
      return new Response('No path provided', { status: 404 })
    }

    if (!slug) {
      return new Response('No path provided', { status: 404 })
    }

    if (!token) {
      new Response('You are not allowed to preview this page', { status: 403 })
    }

    if (!path.startsWith('/')) {
      new Response('This endpoint can only be used for internal previews', { status: 500 })
    }

    let user

    try {
      user = jwt.verify(token, payload.secret)
    } catch (error) {
      payload.logger.error('Error verifying token for live preview:', error)
    }

    const draft = await draftMode()

    // You can add additional checks here to see if the user is allowed to preview this page
    if (!user) {
      draft.disable()
      return new Response('You are not allowed to preview this page', { status: 403 })
    }

    // Verify the given slug exists
    try {
      const docs = await payload.find({
        collection: collection,
        draft: true,
        locale: path.split('/')[0] as TypedLocale,
        where: {
          slug: {
            equals: slug,
          },
        },
      })

      if (!docs.docs.length) {
        return new Response('Document not found', { status: 404 })
      }
    } catch (error) {
      payload.logger.error('Error verifying token for live preview:', error)
    }

    draft.enable()

    redirect(path)
  }
}
