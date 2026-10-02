const formatFieldPath = (path: string): string => path.replaceAll('.', '__')

export const selectors = {
  arrayAddRow: (instancePath: string): string => {
    return `${selectors.fieldWrapper(instancePath)} > .array-field__add-row`
  },
  arrayRows: (instancePath: string): string => {
    return `${selectors.fieldWrapper(instancePath)} > .array-field__draggable-rows > div > .array-field__row`
  },
  blockDrawerToggler: (instancePath: string): string => {
    return `${selectors.fieldWrapper(instancePath)} > .blocks-field__drawer-toggler`
  },
  blockRows: (instancePath: string): string => {
    return `${selectors.fieldWrapper(instancePath)} > .blocks-field__rows > div > .blocks-field__row`
  },
  blocksDrawer: '[id^=drawer_][id*=_blocks-drawer-]',
  blockTypePill: (slug: string): string => {
    return `.blocks-field__block-pill-${slug}`
  },
  documentDrawer: (collectionSlug: string): string => {
    return `[id^=doc-drawer_${collectionSlug}_]`
  },
  fieldWrapper: (instancePath: string): string => {
    return `#field-${formatFieldPath(instancePath)}`
  },
  hasManyTextControl: (instancePath: string): string => {
    return `.field-${formatFieldPath(instancePath)}`
  },
  hasManyTextInput: (instancePath: string): string => {
    return `${selectors.hasManyTextControl(instancePath)} input`
  },
  listCell: (schemaPath: string, rowIndex: number): string => {
    return `.row-${rowIndex + 1} .cell-${formatFieldPath(schemaPath)}`
  },
  listHeading: (schemaPath: string): string => {
    return `#heading-${formatFieldPath(schemaPath)}`
  },
  relationshipAddButton: (instancePath: string): string => {
    return `${selectors.fieldWrapper(instancePath)} .relationship-add-new__add-button`
  },
  relationshipTarget: (collectionSlug: string): string => {
    return `.popup__content .relationship-add-new__relation-button--${collectionSlug}`
  },
  textFieldWrapper: (instancePath: string): string => {
    return `.field-type.text:has(${selectors.textInput(instancePath)})`
  },
  textInput: (instancePath: string): string => {
    return `#${selectors.textInputID(instancePath)}`
  },
  textInputID: (instancePath: string): string => {
    return `field-${formatFieldPath(instancePath)}`
  },
}
