import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get('secret')
  const path = request.nextUrl.searchParams.get('path')
  const tag = request.nextUrl.searchParams.get('tag')

  if (secret !== process.env.REVALIDATION_KEY) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  if (!(path || tag)) {
    return NextResponse.json({ message: 'Missing path or tag param' }, { status: 400 })
  }

  if (path) {
    revalidatePath(path)
    // eslint-disable-next-line no-console
    console.log('revalidated path', path)
  } else if (tag) {
    revalidateTag(tag)
    // eslint-disable-next-line no-console
    console.log('revalidated tag', tag)
    if (tag.startsWith('projects/')) {
      revalidatePath('/') // also revalidate the home page, which has the project grid
      // eslint-disable-next-line no-console
      console.log('revalidated project dependencies')
    }
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
