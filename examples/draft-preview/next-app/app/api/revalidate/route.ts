import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<unknown> {
  const path = request.nextUrl.searchParams.get('revalidatePath')
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY) {
    return NextResponse.json({ revalidated: false, now: Date.now() })
  }

  if (typeof path === 'string') {
    // there is a known bug with `revalidatePath` where it will not revalidate exact paths of dynamic routes
    // instead, Next.js expects us to revalidate entire directories, i.e. `/[slug]` instead of `/example-page`
    // for now we'll make this change but with expectation that it will be fixed so we can use `revalidatePath('/example-page')`
    // - https://github.com/vercel/next.js/issues/49387
    // - https://github.com/vercel/next.js/issues/49778#issuecomment-1547028830
    // revalidatePath(path)
    revalidatePath('/[slug]')
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }

  return NextResponse.json({ revalidated: false, now: Date.now() })
}
