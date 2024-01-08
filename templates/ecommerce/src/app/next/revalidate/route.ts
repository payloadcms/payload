import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * The Next.js API routes can conflict with Payload's own routes if they share the same path
 * To avoid this you can customise the path of Payload or the API route of Nextjs as we've done here
 * See readme: https://github.com/payloadcms/payload/tree/main/templates/ecommerce#conflicting-routes
 *  */
export async function GET(request: NextRequest): Promise<Response> {
  const collection = request.nextUrl.searchParams.get('collection')
  const slug = request.nextUrl.searchParams.get('slug')
  const secret = request.nextUrl.searchParams.get('secret')

  if (
    !secret ||
    secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY ||
    typeof collection !== 'string' ||
    typeof slug !== 'string'
  ) {
    // Do not indicate that the revalidation key is incorrect in the response
    // This will protect this API route from being exploited
    return new Response('Invalid request', { status: 400 })
  }

  if (typeof collection === 'string' && typeof slug === 'string') {
    revalidateTag(`${collection}_${slug}`)
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }

  return NextResponse.json({ revalidated: false, now: Date.now() })
}
