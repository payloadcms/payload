import type { Locator, Page } from '@playwright/test'

import type { BaseFieldModel } from '../modelTypes.js'

import { selectors } from '../selectors.js'

export type LocatorRoot = Pick<Locator, 'locator'> | Pick<Page, 'locator'>

export type CreateBaseFieldModelArgs = {
  instancePath: string
  root: LocatorRoot
  schemaPath: string
  wrapperSelector: string
}

export const createBaseFieldModel = ({
  root,
  schemaPath,
  wrapperSelector,
}: CreateBaseFieldModelArgs): BaseFieldModel => {
  return {
    cell: (rowIndex) => root.locator(selectors.listCell(schemaPath, rowIndex)),
    heading: root.locator(selectors.listHeading(schemaPath)),
    selectors: {
      wrapper: wrapperSelector,
    },
    wrapper: root.locator(wrapperSelector),
  }
}
