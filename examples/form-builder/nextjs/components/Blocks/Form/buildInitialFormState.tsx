import { FormFieldBlock } from "payload-plugin-form-builder/dist/types"

export const buildInitialFormState = (fields: FormFieldBlock[]) => {
  return fields.reduce((initialSchema, field) => {
    if (field.blockType === 'checkbox') {
      return {
        ...initialSchema,
        [field.blockName]: false,
      }
    }
    if (field.blockType === 'country') {
      return {
        ...initialSchema,
        [field.blockName]: '',
      }
    }
    if (field.blockType === 'email') {
      return {
        ...initialSchema,
        [field.blockName]: '',
      }
    }
    if (field.blockType === 'text') {
      return {
        ...initialSchema,
        [field.blockName]: '',
      }
    }
    if (field.blockType === 'select') {
      return {
        ...initialSchema,
        [field.blockName]: '',
      }
    }
    if (field.blockType === 'state') {
      return {
        ...initialSchema,
        [field.blockName]: '',
      }
    }
  }, {})
}
