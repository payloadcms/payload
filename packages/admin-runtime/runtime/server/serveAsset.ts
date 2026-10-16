import fs from 'node:fs/promises'
import path from 'node:path'

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

/** Serves a prebuilt file. Every file name is content-hashed, so it can be cached forever. */
export async function serveAsset({ dir, file }: { dir: string; file: string }): Promise<Response> {
  const filePath = path.resolve(dir, file)

  if (!filePath.startsWith(dir + path.sep)) {
    return new Response('Not found', { status: 404 })
  }

  try {
    return new Response(await fs.readFile(filePath), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
