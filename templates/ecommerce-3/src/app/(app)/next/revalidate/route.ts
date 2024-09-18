import type { NextRequest } from 'next/server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export type RevalidationType = 'path' | 'tag'

export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path')
  const secret = request.nextUrl.searchParams.get('secret')
  const tag = request.nextUrl.searchParams.get('tag')
  const type: RevalidationType =
    (request.nextUrl.searchParams.get('type') as RevalidationType) ?? 'path'

  if (!secret || secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY) {
    // Do not indicate that the revalidation key is incorrect in the response
    // This will protect this API route from being exploited
    return new Response('Invalid request', { status: 400 })
  }

  if ((type === 'path' && !path) || (type === 'tag' && !tag)) {
    return new Response('Invalid request', { status: 400 })
  }

  if (path && type === 'path') {
    revalidatePath(path)
    return NextResponse.json({ now: Date.now(), revalidated: true })
  }

  if (tag && type === 'tag') {
    revalidateTag(tag)
    return NextResponse.json({ now: Date.now(), revalidated: true })
  }

  return NextResponse.json({ now: Date.now(), revalidated: false })
}
