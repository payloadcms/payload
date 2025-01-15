import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { Config, Fruit, Seed } from './payload-types.js'
import { PayloadTestSDK } from 'helpers/sdk/index.js'

type Block = NonNullable<NonNullable<Fruit['blocks']>[0]>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Drag & drop blocks', () => {
  let page: Page
  let url: AdminUrlUtil
  let fruit: Fruit
  let blockAppleA: Block
  let blockAppleB: Block
  let blockPearC: Block
  let seedsAppleA: Seed[]
  let seedsOrangeB: Seed[]
  let seedsPearC: Seed[]
  let context: BrowserContext
  let serverURL: string
  let payload: PayloadTestSDK<Config>
  let blocksIn: Block[]

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'fruits')

    context = await browser.newContext()
    page = await context.newPage()
    await page.setViewportSize({ width: 1270, height: 960 })

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    seedsAppleA = await createSeeds(payload as any, 'Seeds for Apple A')
    seedsOrangeB = await createSeeds(payload as any, 'Seeds for Orange B')
    seedsPearC = await createSeeds(payload as any, 'Seeds for Pear C')

    fruit = await payload.create({
      collection: 'fruits',
      data: {
        blocks: [
          {
            blockName: 'Apple A',
            blockType: 'apples',
            AppleType: 'Apple A',
            seedApple: seedsAppleA,
          },
          {
            blockName: 'Orange B',
            blockType: 'oranges',
            OrangeType: 'Large Orange',
            seedOrange: seedsOrangeB,
          },
          {
            blockName: 'Pear C',
            blockType: 'pears',
            PearType: 'Pear C',
            seedPear: seedsPearC,
          },
          // Add an extra dummy block so that we have a larger droppable area for the third block
          {
            blockName: 'Dummy last block to make dragging easier',
            blockType: 'pears',
            PearType: 'Dummy pear',
            seedPear: [],
          },
        ],
      },
    })
    blockAppleA = fruit.blocks![0] as any
    blockAppleB = fruit.blocks![1] as any
    blockPearC = fruit.blocks![2] as any
    blocksIn = [blockAppleA, blockAppleB, blockPearC]
  })

  test.afterEach(async () => {
    // Reset to same block order
    await payload.update({ collection: 'fruits', id: fruit.id, data: { blocks: blocksIn } })
  })

  test('should drag different blocks around and maintain values even with different block types', async ({}, testInfo) => {
    await page.goto(`${url.serverURL}/admin/collections/fruits/${fruit.id}`)

    // Wait for the blocks to be loaded
    await page.waitForSelector('#field-blocks')

    // Add zoom style so that we can see all blocks when running in headed mode
    await page.evaluate(() => {
      const el = document.getElementsByClassName('collection-edit__form')[0] as HTMLElement
      el.style.zoom = '0.5'
    })

    const blocksIn = [blockAppleA, blockAppleB, blockPearC]

    // Expand all blocks first
    await expandAllBlocks(page, blocksIn)

    const { dragAndDropRandomBlock } = await createRandomBlockDragger(page, blocksIn)

    let blocksOut: Block[] = []
    for (let i = 0; i < 10; i++) {
      blocksOut = await dragAndDropRandomBlock()
      if (i % 2 === 0) {
        await verifyBlockFieldValues(page, blocksOut)
      }
    }
    const autosavePromise = awaitAutosave(page, fruit)
    await verifyBlockFieldValues(page, blocksOut)

    // Verify that all changes are correctly stored after autosave
    await autosavePromise
    await verifyBlockFieldValuesAfterReload(page, blocksOut)
  })
  // NOTE: this test is added to prevent future regressions of the race condition described here:
  // https://github.com/payloadcms/payload/pull/8961
  test('should be able to drag blocks during get form state without race condition', async ({}, testInfo) => {
    await page.goto(`${url.serverURL}/admin/collections/fruits/${fruit.id}`)

    // Wait for the blocks to be loaded
    await page.waitForSelector('#field-blocks')

    // Add zoom style so that we can see all blocks when running in headed mode
    await page.evaluate(() => {
      const el = document.getElementsByClassName('collection-edit__form')[0] as HTMLElement
      el.style.zoom = '0.5'
    })

    const blocksIn = [blockAppleA, blockAppleB, blockPearC]

    // Expand all blocks first
    await expandAllBlocks(page, blocksIn)

    const { dragAndDropRandomBlock } = await createRandomBlockDragger(page, blocksIn)

    // For the race condition to occur, the blocks need to be dragged at the moment
    // the form state is requested in the on change handler
    let blocksOut: Block[] = []
    let requestCount = 0
    let raceconditionResolve: (value: unknown) => void
    const raceconditionPromise = new Promise((resolve) => {
      raceconditionResolve = resolve
    })
    await page.route(`**/admin/collections/fruits/${fruit.id}`, async (route) => {
      // ignore other type of requests
      const request = route.request()
      if (request.method() !== 'POST' || request.headers()['accept'] !== 'text/x-component') {
        await route.continue()
        return
      }
      // At the first request, perform the drag at that moment
      requestCount++
      if (requestCount === 1) {
        blocksOut = await dragAndDropRandomBlock()
      }
      await route.continue()
      raceconditionResolve('resolved')
    })

    // Perform first drag that triggers the second drag during on change handler execution above with the form state request
    blocksOut = await dragAndDropRandomBlock()
    await verifyBlockFieldValues(page, blocksOut)

    // Perform another drag to initiate a render with the incorrect state
    await raceconditionPromise
    const autosavePromise = awaitAutosave(page, fruit)
    blocksOut = await dragAndDropRandomBlock()
    await verifyBlockFieldValues(page, blocksOut)

    // Verify that all changes are correctly stored after autosave
    await autosavePromise
    await verifyBlockFieldValuesAfterReload(page, blocksOut)
  })
})

async function createSeeds(payload: PayloadTestSDK<Config>, namePrefix: string) {
  return [
    await payload.create({
      collection: 'seeds',
      data: {
        name: `${namePrefix} - 1`,
      },
    }),
    await payload.create({
      collection: 'seeds',
      data: {
        name: `${namePrefix} - 2`,
      },
    }),
  ]
}

async function expandAllBlocks(page: Page, blocks: Block[]) {
  await page.locator('button:text("Show All")').click()
  await expect(page.locator(`#field-blocks #blocks-row-${blocks.length - 1}`)).toBeVisible()
}

async function createRandomBlockDragger(page: Page, blocksInput: Block[]) {
  const blocks = [...blocksInput]

  const blockBox1 = await page.locator('#blocks-row-0').boundingBox()
  const draggableIconLocator = page.locator('#field-blocks .collapsible__drag').first()
  const draggableIconBox = await draggableIconLocator.boundingBox()
  const draggableIconOffsetX = draggableIconBox!.x + draggableIconBox!.width * 0.5 - blockBox1!.x

  async function dragAndDropRandomBlock() {
    const sourceBlockIndex = 1
    const possibleIndices = [0, 2]
    const targetBlockIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)]

    const sourceDragIconLocator = page.locator(`#blocks-row-${sourceBlockIndex} .collapsible__drag`)
    const targetBlockBox = await page.locator(`#blocks-row-${targetBlockIndex}`).boundingBox()
    if (!targetBlockBox) {
      throw new Error(`Target block box ${targetBlockIndex} not found`)
    }

    // Calculate target position based on where we want to insert the block
    const target = {
      x: targetBlockBox.x + draggableIconOffsetX,
      y:
        sourceBlockIndex < targetBlockIndex
          ? targetBlockBox.y + 20 // Drop after target
          : targetBlockBox.y - 20, // Drop before target
    }

    await sourceDragIconLocator.hover()
    await page.mouse.down()
    await page.mouse.move(target.x, target.y, { steps: 2 })
    await page.mouse.up()

    // Update blocks array to match the actual DOM order
    const movedBlock = blocks[sourceBlockIndex]
    blocks.splice(sourceBlockIndex, 1)
    blocks.splice(targetBlockIndex, 0, movedBlock)

    return blocks
  }

  return {
    dragAndDropRandomBlock,
  }
}

async function verifyBlockFieldValues(page: Page, blocksOut: Block[]) {
  for (let blockIndex = 0; blockIndex < blocksOut.length; blockIndex++) {
    const block = blocksOut[blockIndex] as Block
    const namePrefix = `blocks.${blockIndex}`

    const fieldNamePrefix = block.blockType[0].toUpperCase() + block.blockType.slice(1, -1)

    // Verify apple kind
    await expect(page.locator(`input[name="${namePrefix}.${fieldNamePrefix}Type"]`)).toBeVisible()
    await expect(page.locator(`input[name="${namePrefix}.${fieldNamePrefix}Type"]`)).toHaveValue(
      block[`${fieldNamePrefix}Type`] ?? '',
    )
    // Verify seed relationships
    const seedsSelector = `#field-blocks__${blockIndex}__seed${fieldNamePrefix} div[class="relationship--multi-value-label__text"]`
    await expect(page.locator(seedsSelector).last()).toBeVisible()
    const seedNames = await page.locator(seedsSelector).allInnerTexts()

    const seedLenth = block[`seed${fieldNamePrefix}`]?.length ?? 0
    for (let seedIndex = 0; seedIndex < seedLenth; seedIndex++) {
      const seed = block[`seed${fieldNamePrefix}`]![seedIndex] as Seed
      expect(seedNames[seedIndex]).toEqual(seed.name)
    }
  }
}

function awaitAutosave(page: Page, fruit: Fruit) {
  return page
    .waitForResponse(
      (resp) => {
        const url = new URL(resp.url())
        if (
          url.pathname.includes(`/api/fruits/${fruit.id}`) &&
          url.searchParams.get('autosave') === 'true'
        ) {
          expect(resp.status()).toBe(200)
          return true
        }
        return false
      },
      { timeout: 9_000 },
    )
    .catch((err) => {
      /*ignore already autosaved */
    })
}

async function verifyBlockFieldValuesAfterReload(page: Page, blocksOut: Block[]) {
  await page.reload()
  await page.evaluate(() => {
    const el = document.getElementsByClassName('collection-edit__form')[0] as HTMLElement
    el.style.zoom = '0.5'
  })
  await expandAllBlocks(page, blocksOut)
  await verifyBlockFieldValues(page, blocksOut)
}
