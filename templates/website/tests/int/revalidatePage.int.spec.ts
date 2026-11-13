import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag: vi.fn() }))

let payload: Payload
const createdIDs: (number | string)[] = []

// What the admin panel's Save Draft and autosave send
const draftSave = { query: { draft: 'true' } }

const publishPage = async (slug: string) => {
  const page = await payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      hero: { type: 'none' },
      layout: [{ blockType: 'content', columns: [] }],
      slug,
      title: slug,
    },
    overrideAccess: true,
  })
  createdIDs.push(page.id)
  revalidatePath.mockClear()
  return page
}

describe('revalidatePage', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const id of createdIDs) {
      await payload.delete({
        id,
        collection: 'pages',
        context: { disableRevalidate: true },
        overrideAccess: true,
      })
    }
  })

  beforeEach(() => {
    revalidatePath.mockClear()
  })

  it('revalidates the published path when a page without a draft is unpublished', async () => {
    const slug = `unpublish-${Date.now()}`
    const page = await publishPage(slug)

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { _status: 'draft' },
      overrideAccess: true,
    })

    expect(revalidatePath).toHaveBeenCalledWith(`/${slug}`)
  })

  // https://github.com/payloadcms/payload/issues/19531
  it('revalidates the published path when a page with a newer draft is unpublished', async () => {
    const slug = `unpublish-with-draft-${Date.now()}`
    const page = await publishPage(slug)

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { title: `${slug} (draft edit)` },
      draft: true,
      overrideAccess: true,
      req: draftSave,
    })
    revalidatePath.mockClear()

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { _status: 'draft' },
      overrideAccess: true,
    })
    expect(revalidatePath).toHaveBeenCalledWith(`/${slug}`)
  })

  it('revalidates the published path, not the draft one, when the draft changed the slug', async () => {
    const slug = `unpublish-renamed-${Date.now()}`
    const page = await publishPage(slug)

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { slug: `${slug}-renamed` },
      draft: true,
      overrideAccess: true,
      req: draftSave,
    })
    revalidatePath.mockClear()

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { _status: 'draft' },
      overrideAccess: true,
    })

    expect(revalidatePath).toHaveBeenCalledWith(`/${slug}`)
    expect(revalidatePath).not.toHaveBeenCalledWith(`/${slug}-renamed`)
  })

  it('does not revalidate when a draft is saved over a published page', async () => {
    const page = await publishPage(`draft-save-${Date.now()}`)

    await payload.update({
      id: page.id,
      collection: 'pages',
      data: { title: 'draft edit' },
      draft: true,
      overrideAccess: true,
      req: draftSave,
    })

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
