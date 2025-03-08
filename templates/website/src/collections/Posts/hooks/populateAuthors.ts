import type { CollectionAfterReadHook } from 'payload'
import { User } from 'src/payload-types'

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors) {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      const authorId = typeof author === 'object' ? author?.id : author

      try {
        if (!authorId) {
          continue
        }

        const authorDoc = await payload?.findByID({
          id: authorId,
          collection: 'users',
          depth: 0,
          req,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }
      } catch (error) {
        payload.logger.error({ err: error }, `Error fetching author with ID: ${authorId}`)
      }
    }

    doc.populatedAuthors = authorDocs.map((authorDoc) => ({
      id: authorDoc.id,
      name: authorDoc.name,
    }))
  }

  return doc
}
