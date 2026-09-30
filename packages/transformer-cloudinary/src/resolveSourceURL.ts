import type { CollectionSlug } from 'payload'

import type { ResolveSourceURL } from './types.js'

type FileRecord = {
  filename?: null | string
  url?: null | string
}

/**
 * Default source-URL resolution: looks the document up under the requesting user's
 * own access, matches the requested filename against the main file or one of its
 * `sizes`, and resolves that entry's `url` against the config's `serverURL`.
 *
 * Cloudinary fetches this URL itself, so it must be publicly reachable. When a
 * collection serves files through Payload's access-controlled route, that route has
 * to be publicly readable - otherwise point `sourceURL` at your storage adapter's
 * direct CDN URL instead.
 */
export function createResolveSourceURL(): ResolveSourceURL {
  return async ({ collectionSlug, documentID, filename, req }) => {
    const doc = (await req.payload.findByID({
      id: documentID,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- `CollectionSlug` is `string` here, but narrows to a union in a project with generated types, where the transformer contract's plain `string` no longer assigns.
      collection: collectionSlug as CollectionSlug,
      depth: 0,
      draft: true,
      overrideAccess: false,
      req,
      user: req.user,
    })) as { sizes?: Record<string, FileRecord> } & FileRecord

    const match =
      doc?.filename === filename
        ? doc
        : Object.values(doc?.sizes ?? {}).find((size) => size?.filename === filename)

    if (!match?.url) {
      throw new Error(
        `cloudinaryTransformer could not resolve a source URL for "${filename}" in "${collectionSlug}". Provide a \`sourceURL\` resolver.`,
      )
    }

    return toAbsoluteURL({ serverURL: req.payload.config.serverURL, url: match.url })
  }
}

function toAbsoluteURL({ serverURL, url }: { serverURL?: string; url: string }): string {
  if (URL.canParse(url)) {
    return url
  }

  if (!serverURL) {
    throw new Error(
      `cloudinaryTransformer resolved the relative source URL "${url}", but \`serverURL\` is not set in your Payload config. Cloudinary fetches the source itself and needs an absolute, publicly reachable URL - set \`serverURL\` or provide a \`sourceURL\` resolver.`,
    )
  }

  return new URL(url, serverURL).href
}
