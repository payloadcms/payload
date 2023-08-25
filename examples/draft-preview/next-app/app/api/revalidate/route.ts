import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// this endpoint will revalidate a page by tag or path
// this is to achieve on-demand revalidation of pages that use this data
// send either `collection` and `slug` or `revalidatePath` as query params
export async function GET(request: NextRequest): Promise<unknown> {
  const collection = request.nextUrl.searchParams.get('collection')
  const slug = request.nextUrl.searchParams.get('slug')
  const path = request.nextUrl.searchParams.get('path')
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY) {
    return NextResponse.json({ revalidated: false, now: Date.now() })
  }

  if (typeof collection === 'string' && typeof slug === 'string') {
    revalidateTag(`${collection}_${slug}`)
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }

  // there is a known limitation with `revalidatePath` where it will not revalidate exact paths of dynamic routes
  // instead, Next.js expects us to revalidate entire directories, i.e. `revalidatePath('/[slug]')` instead of `/example-page`
  // for this reason, it is preferred to use `revalidateTag` instead of `revalidatePath`
  // - https://github.com/vercel/next.js/issues/49387
  // - https://github.com/vercel/next.js/issues/49778#issuecomment-1547028830
  if (typeof path === 'string') {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }

  return NextResponse.json({ revalidated: false, now: Date.now() })
}
