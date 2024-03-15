import type { NextRequest } from 'next/server'

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

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
    return NextResponse.json({ now: Date.now(), revalidated: true })
  }

  return NextResponse.json({ now: Date.now(), revalidated: false })
}
