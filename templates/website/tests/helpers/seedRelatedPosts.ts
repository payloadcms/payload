import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../../src/payload.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Revalidation hooks call `revalidatePath`, which is unavailable outside a Next request.
const disableRevalidate = { context: { disableRevalidate: true } }

export const relatedPostsFixture = {
  categorySlug: 'test-category',
  categoryTitle: 'Test Category',
  imageAlt: 'Test image',
  postSlug: 'test-post-with-related-posts',
  postTitle: 'Test Post With Related Posts',
  relatedPostSlug: 'test-related-post',
  relatedPostTitle: 'Test Related Post',
}

/**
 * Creates a published post that links to one related post, where the related
 * post has both an SEO image and a category. Gives the related-post cards on
 * the post page something to render.
 */
export async function seedRelatedPosts(): Promise<void> {
  const payload = await getPayload({ config })

  await deleteFixture({ payload })

  const category = await payload.create({
    collection: 'categories',
    data: {
      slug: relatedPostsFixture.categorySlug,
      title: relatedPostsFixture.categoryTitle,
    },
    ...disableRevalidate,
  })

  const image = await payload.create({
    collection: 'media',
    data: { alt: relatedPostsFixture.imageAlt },
    filePath: path.resolve(dirname, '../../src/endpoints/seed/image-post1.webp'),
    ...disableRevalidate,
  })

  const relatedPost = await payload.create({
    collection: 'posts',
    data: {
      _status: 'published',
      categories: [category.id],
      content: buildContent('Related post content.'),
      meta: { image: image.id },
      slug: relatedPostsFixture.relatedPostSlug,
      title: relatedPostsFixture.relatedPostTitle,
    },
    ...disableRevalidate,
  })

  await payload.create({
    collection: 'posts',
    data: {
      _status: 'published',
      content: buildContent('Post content.'),
      relatedPosts: [relatedPost.id],
      slug: relatedPostsFixture.postSlug,
      title: relatedPostsFixture.postTitle,
    },
    ...disableRevalidate,
  })
}

export async function cleanupRelatedPosts(): Promise<void> {
  const payload = await getPayload({ config })

  await deleteFixture({ payload })
}

async function deleteFixture({ payload }: { payload: Payload }): Promise<void> {
  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        in: [relatedPostsFixture.postSlug, relatedPostsFixture.relatedPostSlug],
      },
    },
    ...disableRevalidate,
  })

  await payload.delete({
    collection: 'categories',
    where: {
      slug: { equals: relatedPostsFixture.categorySlug },
    },
    ...disableRevalidate,
  })

  await payload.delete({
    collection: 'media',
    where: {
      alt: { equals: relatedPostsFixture.imageAlt },
    },
    ...disableRevalidate,
  })
}

function buildContent(text: string): RequiredDataFromCollectionSlug<'posts'>['content'] {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
