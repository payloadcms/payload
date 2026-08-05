// Stub for @payloadcms/next/dist/routes/rest/og/index.js
//
// The real module imports `next/og.js` (ImageResponse), which pulls ~2.9 MiB
// of @vercel/og WASM + fonts into the Cloudflare Worker bundle. @vercel/og
// works on Workers through OpenNext's compatibility patches, but the ~744 KiB
// gzip cost pushes the template over the free-tier 3 MiB limit. This template
// sets `admin.meta.defaultOGImageType: 'off'` in payload.config.ts, so the
// stub mirrors the real module's "disabled" behavior (HTTP 400) while keeping
// the entire @vercel/og dependency chain out of the module graph.
//
// Aliased in next.config.ts. To re-enable OG image generation, remove the
// alias there and remove `defaultOGImageType: 'off'` from payload.config.ts.
export const runtime = 'nodejs'
export const contentType = 'image/png'
export const generateOGImage = async () => {
  return Response.json({ error: 'Open Graph images are disabled' }, { status: 400 })
}
