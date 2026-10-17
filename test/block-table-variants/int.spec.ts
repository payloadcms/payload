import type { Payload } from 'payload'

import { eq } from 'drizzle-orm'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { pagesSlug } from './shared.js'

/** `grid > columns > content` is walked first, so the top-level placement is the numbered one */
const nestedCardTable = 'pages_blocks_card'
const topLevelCardTable = 'pages_blocks_card_2'

const cardRows = (payload: Payload, tableName: string, parentID: number | string) => {
  const db = payload.db as any
  const table = db.tables[tableName]

  return db.drizzle.select().from(table).where(eq(table._parentID, parentID))
}

/**
 * Leaves the page's top-level cards where an older config would have stored them: in the table that placement had
 * before a placement walked earlier was added, which now belongs to the card inside `grid`
 */
const strandTopLevelCards = async (payload: Payload, parentID: number | string) => {
  const db = payload.db as any
  const rows = await cardRows(payload, topLevelCardTable, parentID)

  await db.drizzle.insert(db.tables[nestedCardTable]).values(rows)
  await db.drizzle
    .delete(db.tables[topLevelCardTable])
    .where(eq(db.tables[topLevelCardTable]._parentID, parentID))
}

test.suite('block-table-variants', { config: './config.ts', db: 'drizzle' }, () => {
  test('stores each placement of a block in its own table', async ({ payload }) => {
    const db = payload.db as any

    expect(db.tables[nestedCardTable]).toBeDefined()
    expect(db.tables[topLevelCardTable]).toBeDefined()

    const page = await payload.create({
      collection: pagesSlug,
      data: { content: [{ blockType: 'card', title: 'top' }] },
    })

    expect(await cardRows(payload, nestedCardTable, page.id)).toHaveLength(0)
    expect(await cardRows(payload, topLevelCardTable, page.id)).toHaveLength(1)
  })

  test('does not duplicate a block stored in another numbered table of it when the document is saved', async ({
    payload,
  }) => {
    const page = await payload.create({
      collection: pagesSlug,
      data: { content: [{ blockType: 'card', styles: { tone: 'warm' }, title: 'only card' }] },
    })

    await strandTopLevelCards(payload, page.id)

    // Reads merge the rows of every table of the block by path, so the stranded card still reads back
    const read = await payload.findByID({ id: page.id, collection: pagesSlug })
    expect(read.content).toHaveLength(1)

    // Saved as the admin panel saves it: with the content it read
    const updated = await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: { content: read.content },
    })

    expect(updated.content).toHaveLength(1)
    expect(updated.content?.[0]).toMatchObject({ styles: { tone: 'warm' }, title: 'only card' })
    expect(await cardRows(payload, nestedCardTable, page.id)).toHaveLength(0)
    expect(await cardRows(payload, topLevelCardTable, page.id)).toHaveLength(1)
  })

  test('removes a block stored in another numbered table of it when the document is saved without it', async ({
    payload,
  }) => {
    const page = await payload.create({
      collection: pagesSlug,
      data: { content: [{ blockType: 'card', title: 'removed card' }] },
    })

    await strandTopLevelCards(payload, page.id)

    const updated = await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: { content: [] },
    })

    expect(updated.content).toHaveLength(0)
    const read = await payload.findByID({ id: page.id, collection: pagesSlug })
    expect(read.content).toHaveLength(0)
  })

  test('keeps the rows of the placement a numbered table belongs to', async ({ payload }) => {
    const page = await payload.create({
      collection: pagesSlug,
      data: {
        content: [
          { blockType: 'card', title: 'top' },
          {
            blockType: 'grid',
            columns: [{ content: [{ blockType: 'card', title: 'nested' }] }],
          },
        ],
      },
    })

    const other = await payload.create({
      collection: pagesSlug,
      data: { content: [{ blockType: 'card', title: 'other page' }] },
    })

    await strandTopLevelCards(payload, other.id)

    const updated = await payload.update({
      id: page.id,
      collection: pagesSlug,
      data: { content: page.content },
    })

    expect(updated.content).toMatchObject([
      { blockType: 'card', title: 'top' },
      { blockType: 'grid', columns: [{ content: [{ blockType: 'card', title: 'nested' }] }] },
    ])
    // Another document's stranded card is left to that document's next save
    expect(await cardRows(payload, nestedCardTable, other.id)).toHaveLength(1)
  })
})
