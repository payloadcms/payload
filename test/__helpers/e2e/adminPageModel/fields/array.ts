import { expect } from '@playwright/test'

import type { ArrayFieldModel } from '../modelTypes.js'
import type {
  CreateFieldsModel,
  FieldsModelContext,
  RuntimeFieldDescriptor,
  RuntimeFieldsDescriptor,
} from '../runtimeTypes.js'

import { formatIndexedLocatorContext } from '../errors.js'
import { selectors } from '../selectors.js'
import { createBaseFieldModel } from './base.js'

type CreateArrayFieldModelArgs = {
  createFieldsModel: CreateFieldsModel
  descriptor: {
    fields: RuntimeFieldsDescriptor
  } & RuntimeFieldDescriptor
  instancePath: string
} & FieldsModelContext

export const createArrayFieldModel = ({
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
}: CreateArrayFieldModelArgs): ArrayFieldModel<RuntimeFieldsDescriptor> => {
  const rowsSelector = selectors.arrayRows(instancePath)
  const rows = root.locator(rowsSelector)
  const baseField = createBaseFieldModel({
    instancePath,
    root,
    schemaPath: descriptor.path,
    wrapperSelector: selectors.fieldWrapper(instancePath),
  })

  const row = async (index: number) => {
    const availableCount = await rows.count()
    const rowLocator = rows.nth(index >= 0 ? index : availableCount)

    await expect(
      rowLocator,
      formatIndexedLocatorContext({
        availableCount,
        collectionSlug,
        fieldPath: descriptor.path,
        index,
        itemName: 'row',
        scope,
        selector: rowsSelector,
      }),
    ).toHaveCount(1)

    return {
      fields: createFieldsModel(descriptor.fields, {
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
    addRow: async () => {
      const previousCount = await rows.count()

      await root.locator(selectors.arrayAddRow(instancePath)).click()
      await expect(
        rows,
        `Expected addRow() to add one row to "${descriptor.path}" in collection "${collectionSlug}".`,
      ).toHaveCount(previousCount + 1)

      return row(previousCount)
    },
    row,
  } as ArrayFieldModel<RuntimeFieldsDescriptor>
}
