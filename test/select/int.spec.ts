import path from 'path'
import { deepCopyObject, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { LocalizedPost, Post, VersionedPost } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Select', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Local API - Base', () => {
    let post: Post
    let postId: number | string

    beforeEach(async () => {
      post = await createPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'posts' })
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: post.group,
        })
      })

      it('should select text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group.text,
          },
        })
      })

      it('should select id as default from array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array,
        })
      })

      it('should select text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) => ({ blockType: block.blockType, id: block.id })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks,
        })
      })

      it('should select all the fields inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? block
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? { id: block.id, blockType: block.blockType, ctaText: block.ctaText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: false,
          },
        })

        const expected = { ...post }

        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number and text', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            number: false,
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']
        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: false,
          },
        })

        const expected = { ...post }

        delete expected['group']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: false,
          },
        })

        const expected = { ...post }

        delete expected['array']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: false,
          },
        })

        const expected = { ...post }

        delete expected['blocks']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude all the fields inside of specific block while keeping base fields', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) => {
            delete block['ctaText']

            return block
          }),
        })
      })
    })
  })

  describe('Local API - Localization', () => {
    let post: LocalizedPost
    let postId: number | string

    beforeEach(async () => {
      post = await createLocalizedPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'localized-posts' })
    })

    describe('Include mode', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {},
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })

      it('should select all the fields inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: post.group,
        })
      })

      it('should select text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          group: {
            text: post.group.text,
          },
        })
      })

      it('should select localized text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            groupSecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          groupSecond: {
            text: post.groupSecond.text,
          },
        })
      })

      it('should select id as default from array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({ id: item.id })),
        })
      })

      it('should select all the fields inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array,
        })
      })

      it('should select text field inside of localized array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          array: post.array.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select localized text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            arraySecond: {
              text: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          arraySecond: post.arraySecond.map((item) => ({
            id: item.id,
            text: item.text,
          })),
        })
      })

      it('should select base fields (id, blockType) inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {},
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) => ({ blockType: block.blockType, id: block.id })),
        })
      })

      it('should select all the fields inside of blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: true,
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks,
        })
      })

      it('should select all the fields inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: true,
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? block
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta'
              ? { id: block.id, blockType: block.blockType, ctaText: block.ctaText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific localized field inside of specific block 1', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              second: { text: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'second'
              ? { id: block.id, blockType: block.blockType, text: block.text }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })

      it('should select a specific localized field inside of specific block 2', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              first: { firstText: true },
            },
          },
        })

        expect(res).toStrictEqual({
          id: postId,
          blocksSecond: post.blocksSecond.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'first'
              ? { id: block.id, blockType: block.blockType, firstText: block.firstText }
              : {
                  id: block.id,
                  blockType: block.blockType,
                },
          ),
        })
      })
    })

    describe('Exclude mode', () => {
      it('should exclude only text field', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: false,
          },
        })

        const expected = { ...post }

        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude number and text', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            number: false,
            text: false,
          },
        })

        const expected = { ...post }

        delete expected['text']
        delete expected['number']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: false,
          },
        })

        const expected = { ...post }

        delete expected['group']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            group: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.group.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude localized text field inside of group', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            groupSecond: {
              text: false,
            },
          },
        })

        const expected = deepCopyObject(post)

        delete expected.groupSecond.text

        expect(res).toStrictEqual(expected)
      })

      it('should exclude array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: false,
          },
        })

        const expected = { ...post }

        delete expected['array']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            array: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          array: post.array.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude localized text field inside of array', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            arraySecond: {
              text: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          arraySecond: post.arraySecond.map((item) => ({
            id: item.id,
            number: item.number,
          })),
        })
      })

      it('should exclude blocks', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: false,
          },
        })

        const expected = { ...post }

        delete expected['blocks']

        expect(res).toStrictEqual(expected)
      })

      it('should exclude all the fields inside of specific block while keeping base fields', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: false,
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) =>
            // eslint-disable-next-line jest/no-conditional-in-test
            block.blockType === 'cta' ? { id: block.id, blockType: block.blockType } : block,
          ),
        })
      })

      it('should exclude a specific field inside of specific block', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocks: {
              cta: { ctaText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocks: post.blocks.map((block) => {
            delete block['ctaText']

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 1', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              second: { text: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocksSecond: post.blocksSecond.map((block) => {
            // eslint-disable-next-line jest/no-conditional-in-test
            if (block.blockType === 'second') {
              delete block['text']
            }

            return block
          }),
        })
      })

      it('should exclude a specific localized field inside of specific block 2', async () => {
        const res = await payload.findByID({
          collection: 'localized-posts',
          id: postId,
          select: {
            blocksSecond: {
              first: { firstText: false },
            },
          },
        })

        expect(res).toStrictEqual({
          ...post,
          blocksSecond: post.blocksSecond.map((block) => {
            delete block['firstText']

            return block
          }),
        })
      })
    })
  })

  describe('Local API - Versioned Drafts Collection', () => {
    let post: VersionedPost
    let postId: number | string

    beforeEach(async () => {
      post = await createVersionedPost()
      postId = post.id
    })

    // Clean up to safely mutate in each test
    afterEach(async () => {
      await payload.delete({ id: postId, collection: 'versioned-posts' })
    })

    describe('Include mode draft: false', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {},
          draft: false,
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {
            number: true,
          },
          draft: false,
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
          draft: false,
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })
    })

    describe('Include mode draft: true', () => {
      it('should select only id as default', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {},
          draft: true,
        })

        expect(res).toStrictEqual({
          id: postId,
        })
      })

      it('should select only number', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {
            number: true,
          },
          draft: true,
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
        })
      })

      it('should select number and text', async () => {
        const res = await payload.findByID({
          collection: 'versioned-posts',
          id: postId,
          select: {
            number: true,
            text: true,
          },
          draft: true,
        })

        expect(res).toStrictEqual({
          id: postId,
          number: post.number,
          text: post.text,
        })
      })
    })
  })
})

function createPost() {
  return payload.create({
    collection: 'posts',
    depth: 0,
    data: {
      number: 1,
      text: 'text',
      group: {
        number: 1,
        text: 'text',
      },
      blocks: [
        {
          blockType: 'cta',
          ctaText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'intro',
          introText: 'intro-text',
          text: 'text',
        },
      ],
      array: [
        {
          text: 'text',
          number: 1,
        },
      ],
    },
  })
}

function createLocalizedPost() {
  return payload.create({
    collection: 'localized-posts',
    depth: 0,
    data: {
      number: 1,
      text: 'text',
      group: {
        number: 1,
        text: 'text',
      },
      groupSecond: {
        number: 1,
        text: 'text',
      },
      blocks: [
        {
          blockType: 'cta',
          ctaText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'intro',
          introText: 'intro-text',
          text: 'text',
        },
      ],
      blocksSecond: [
        {
          blockType: 'second',
          secondText: 'cta-text',
          text: 'text',
        },
        {
          blockType: 'first',
          firstText: 'intro-text',
          text: 'text',
        },
      ],
      array: [
        {
          text: 'text',
          number: 1,
        },
      ],
      arraySecond: [
        {
          text: 'text',
          number: 1,
        },
      ],
    },
  })
}

function createVersionedPost() {
  return payload.create({
    collection: 'versioned-posts',
    data: {
      number: 2,
      text: 'text',
    },
  })
}
