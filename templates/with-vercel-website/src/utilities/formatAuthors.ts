import { Post } from '@/payload-types'

/**
 * Formats an array of populatedAuthors from Posts into a prettified string.
 * @param authors - The populatedAuthors array from a Post.
 * @returns A prettified string of authors.
 * @example
 *
 * [Author1, Author2] becomes 'Author1 and Author2'
 * [Author1, Author2, Author3] becomes 'Author1, Author2, and Author3'
 *
 */
export const formatAuthors = (
  authors: NonNullable<NonNullable<Post['populatedAuthors']>[number]>[],
) => {
  // Ensure we don't have any authors without a name
  const filteredAuthors = authors.filter((author) => Boolean(author.name))

  if (filteredAuthors.length === 0) return ''
  if (filteredAuthors.length === 1) return filteredAuthors[0].name
  if (filteredAuthors.length === 2)
    return `${filteredAuthors[0].name} and ${filteredAuthors[1].name}`

  return `${filteredAuthors
    .slice(0, -1)
    .map((author) => author?.name)
    .join(', ')} and ${filteredAuthors[authors.length - 1].name}`
}
