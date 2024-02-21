import { NextResponse } from 'next/server'

/**
 * The Next.js API routes can conflict with Payload's own routes if they share the same path
 * To avoid this you can customise the path of Payload or the API route of Nextjs as we've done here
 * See readme: https://github.com/payloadcms/payload/tree/main/examples/custom-server#conflicting-routes
 *  */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ success: true })
}
