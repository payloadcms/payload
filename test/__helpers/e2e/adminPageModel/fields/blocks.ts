import { expect } from '@playwright/test'

import type { BlocksFieldModel } from '../modelTypes.js'
import type {
  CreateFieldsModel,
  FieldsModelContext,
  RuntimeBlockDescriptor,
  RuntimeFieldDescriptor,
} from '../runtimeTypes.js'

import { formatBlockTypeContext, formatIndexedLocatorContext } from '../errors.js'
import { selectors } from '../selectors.js'
import { createBaseFieldModel } from './base.js'

type CreateBlocksFieldModelArgs = {
  createFieldsModel: CreateFieldsModel
  descriptor: {
    blocks: Readonly<Record<string, RuntimeBlockDescriptor>>
  } & RuntimeFieldDescriptor
  instancePath: string
} & FieldsModelContext

export const createBlocksFieldModel = ({
  collectionSlug,
  createFieldsModel,
  descriptor,
  instancePath,
  model,
  page,
  root,
  routes,
  scope,
  serverURL,
}: CreateBlocksFieldModelArgs): BlocksFieldModel<
  Readonly<Record<string, RuntimeBlockDescriptor>>
> => {
  const rowsSelector = selectors.blockRows(instancePath)
  const rows = root.locator(rowsSelector)
  const baseField = createBaseFieldModel({
    instancePath,
    root,
    schemaPath: descriptor.path,
    wrapperSelector: selectors.fieldWrapper(instancePath),
  })
  const getBlockDescriptor = (slug: string): RuntimeBlockDescriptor => {
    const blockDescriptor = descriptor.blocks[slug]

    if (!blockDescriptor) {
      throw new Error(
        `Block "${slug}" is not present in the generated model for "${descriptor.path}".`,
      )
    }

    return blockDescriptor
  }

  const block = async (index: number, slug: string) => {
    const availableCount = await rows.count()
    const rowLocator = rows.nth(index >= 0 ? index : availableCount)

    await expect(
      rowLocator,
      formatIndexedLocatorContext({
        availableCount,
        collectionSlug,
        fieldPath: descriptor.path,
        index,
        itemName: 'block',
        scope,
        selector: rowsSelector,
      }),
    ).toHaveCount(1)

    const blockTypeSelector = selectors.blockTypePill(slug)

    await expect(
      rowLocator.locator(blockTypeSelector),
      formatBlockTypeContext({
        slug,
        collectionSlug,
        fieldPath: descriptor.path,
        index,
        scope,
        selector: blockTypeSelector,
      }),
    ).toHaveCount(1)

    const blockDescriptor = getBlockDescriptor(slug)

    return {
      slug,
      fields: createFieldsModel(blockDescriptor.fields, {
        collectionSlug,
        instanceParentPath: `${instancePath}.${index}`,
        model,
        page,
        root: rowLocator,
        routes,
        schemaParentPath: descriptor.path,
        scope,
        serverURL,
      }),
      wrapper: rowLocator,
    }
  }

  return {
    ...baseField,
    addBlock: async (slug) => {
      const previousCount = await rows.count()
      const blockDescriptor = getBlockDescriptor(slug)

      await root.locator(selectors.blockDrawerToggler(instancePath)).click()

      const blocksDrawer = page.locator(selectors.blocksDrawer).last()
      await expect(blocksDrawer).toBeVisible()
      await blocksDrawer
        .locator('button.thumbnail-card', { hasText: blockDescriptor.label })
        .dblclick()
      await expect(
        rows,
        `Expected addBlock("${slug}") to add one block to "${descriptor.path}" in collection "${collectionSlug}".`,
      ).toHaveCount(previousCount + 1)

      return block(previousCount, slug)
    },
    block,
  } as BlocksFieldModel<Readonly<Record<string, RuntimeBlockDescriptor>>>
}
