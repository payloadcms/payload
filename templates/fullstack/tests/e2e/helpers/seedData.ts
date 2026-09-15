import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
if (typeof process.loadEnvFile === 'function' && !process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.resolve(__dirname, '../../../.env'))
  } catch {}
}

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

export const publishedPostSlug = 'e2e-published-post'
export const draftPostSlug = 'e2e-draft-post'

export async function seedTestData(): Promise<void> {
  const { default: config } = await import('../../../src/payload.config')
  const payload = await getPayload({ config })

  // Clean existing test posts
  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        in: [publishedPostSlug, draftPostSlug],
      },
    },
  })

  // Create published test post with blocks
  await payload.create({
    collection: 'posts',
    data: {
      title: 'E2E Published Post Title',
      slug: publishedPostSlug,
      _status: 'published',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'This is verified test content for E2E validation.',
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      layout: [
        {
          blockType: 'hero',
          headline: 'E2E Hero Block Headline',
          subheadline: 'E2E Hero Subheadline text',
          ctaText: 'Explore CTA',
          ctaLink: 'https://example.com/explore',
        },
        {
          blockType: 'featureGrid',
          sectionTitle: 'E2E Feature Grid Title',
          features: [
            {
              title: 'Feature Alpha',
              description: 'Description for Feature Alpha',
            },
            {
              title: 'Feature Beta',
              description: 'Description for Feature Beta',
            },
          ],
        },
        {
          blockType: 'callToAction',
          title: 'Ready for Action?',
          description: 'Click the button below to continue',
          buttonText: 'Get Started Now',
          buttonLink: '/admin',
        },
      ],
    },
  })

  // Create draft post
  await payload.create({
    collection: 'posts',
    data: {
      title: 'E2E Secret Draft Post',
      slug: draftPostSlug,
      _status: 'draft',
    },
  })
}

export async function cleanupTestData(): Promise<void> {
  const { default: config } = await import('../../../src/payload.config')
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        in: [publishedPostSlug, draftPostSlug],
      },
    },
  })
}
