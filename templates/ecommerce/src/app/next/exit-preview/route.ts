import { draftMode } from 'next/headers'

/**
 * The Next.js API routes can conflict with Payload's own routes if they share the same path
 * To avoid this you can customise the path of Payload or the API route of Nextjs as we've done here
 * See readme: https://github.com/payloadcms/payload/tree/main/templates/ecommerce#conflicting-routes
 *  */
export async function GET(): Promise<Response> {
  draftMode().disable()
  return new Response('Draft mode is disabled')
}
