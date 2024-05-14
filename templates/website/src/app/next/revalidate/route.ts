import type { NextRequest } from 'next/server'

import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/require-await
export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path')
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret || secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY || typeof path !== 'string') {
    // Do not indicate that the revalidation key is incorrect in the response
    // This will protect this API route from being exploited
    return new Response('Invalid request', { status: 400 })
  }

  if (typeof path === 'string') {
    revalidatePath(path)
    return NextResponse.json({ now: Date.now(), revalidated: true })
  }

  return NextResponse.json({ now: Date.now(), revalidated: false })
}
