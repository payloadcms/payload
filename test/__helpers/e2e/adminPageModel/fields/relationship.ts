import type { Locator } from '@playwright/test'

import { expect } from '@playwright/test'

import type { RelationshipFieldModel } from '../modelTypes.js'
import type {
  FieldsModelContext,
  RuntimeAdminPageModel,
  RuntimeCollectionDescriptor,
  RuntimeFieldDescriptor,
} from '../runtimeTypes.js'

import { selectors } from '../selectors.js'
import { createBaseFieldModel } from './base.js'

type CreateRelationshipFieldModelArgs = {
  createCollectionModel: (descriptor: RuntimeCollectionDescriptor, root: Locator) => unknown
  descriptor: {
    relationTo: readonly string[]
  } & RuntimeFieldDescriptor
  instancePath: string
  model: RuntimeAdminPageModel
} & FieldsModelContext

export const createRelationshipFieldModel = ({
  createCollectionModel,
  descriptor,
  instancePath,
  model,
  page,
  root,
}: CreateRelationshipFieldModelArgs): RelationshipFieldModel<
  RuntimeAdminPageModel,
  RuntimeFieldDescriptor
> => {
  const wrapperSelector = selectors.fieldWrapper(instancePath)
  const baseField = createBaseFieldModel({
    instancePath,
    root,
    schemaPath: descriptor.path,
    wrapperSelector,
  })

  return {
    ...baseField,
    createInDrawer: async (targetSlug?: string) => {
      const resolvedTargetSlug = targetSlug ?? descriptor.relationTo[0]

      if (!resolvedTargetSlug || !descriptor.relationTo.includes(resolvedTargetSlug)) {
        throw new Error(
          `Cannot create relationship target "${String(resolvedTargetSlug)}" from field "${descriptor.path}". Valid targets: ${descriptor.relationTo.join(', ')}.`,
        )
      }

      const targetDescriptor = model.collections[resolvedTargetSlug]

      if (!targetDescriptor) {
        throw new Error(
          `Cannot create a typed drawer for "${resolvedTargetSlug}" because it is absent from the generated Admin page model.`,
        )
      }

      const addButton = root.locator(selectors.relationshipAddButton(instancePath))
      await expect(
        addButton,
        `Expected relationship field "${descriptor.path}" to provide an add-new button.`,
      ).toBeVisible()
      await addButton.click()

      if (descriptor.relationTo.length > 1) {
        const targetButton = page.locator(selectors.relationshipTarget(resolvedTargetSlug))
        await expect(
          targetButton,
          `Expected relationship field "${descriptor.path}" to offer target "${resolvedTargetSlug}".`,
        ).toBeVisible()
        await targetButton.click()
      }

      const drawer = page.locator(selectors.documentDrawer(resolvedTargetSlug)).last()
      await expect(
        drawer,
        `Expected a document drawer for collection "${resolvedTargetSlug}" to open from relationship field "${descriptor.path}".`,
      ).toBeVisible()

      return createCollectionModel(targetDescriptor, drawer)
    },
  } as RelationshipFieldModel<RuntimeAdminPageModel, RuntimeFieldDescriptor>
}
