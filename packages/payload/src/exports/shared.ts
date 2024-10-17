export {
  generateCookie,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getCookieExpiration,
  parseCookies,
} from '../auth/cookies.js'
export { parsePayloadComponent } from '../bin/generateImportMap/parsePayloadComponent.js'
export { defaults as collectionDefaults } from '../collections/config/defaults.js'

export { serverProps } from '../config/types.js'

export {
  fieldAffectsData,
  fieldHasMaxDepth,
  fieldHasSubFields,
  fieldIsArrayType,
  fieldIsBlockType,
  fieldIsGroupType,
  fieldIsLocalized,
  fieldIsPresentationalOnly,
  fieldIsSidebar,
  fieldIsVirtual,
  fieldSupportsMany,
  optionIsObject,
  optionIsValue,
  optionsAreObjects,
  tabHasName,
  valueIsValueWithRelation,
} from '../fields/config/types.js'
export * from '../fields/validations.js'

export { validOperators } from '../types/constants.js'

export { formatFilesize } from '../uploads/formatFilesize.js'

export { isImage } from '../uploads/isImage.js'
export {
  deepCopyObject,
  deepCopyObjectComplex,
  deepCopyObjectSimple,
} from '../utilities/deepCopyObject.js'

export {
  deepMerge,
  deepMergeWithCombinedArrays,
  deepMergeWithReactComponents,
  deepMergeWithSourceArrays,
} from '../utilities/deepMerge.js'

export { fieldSchemaToJSON } from '../utilities/fieldSchemaToJSON.js'
export { getDataByPath } from '../utilities/getDataByPath.js'

export { getSiblingData } from '../utilities/getSiblingData.js'

export { getUniqueListBy } from '../utilities/getUniqueListBy.js'

export { isNumber } from '../utilities/isNumber.js'

export {
  isReactClientComponent,
  isReactComponentOrFunction,
  isReactServerComponentOrFunction,
} from '../utilities/isReactComponent.js'

export { reduceFieldsToValues } from '../utilities/reduceFieldsToValues.js'

export { setsAreEqual } from '../utilities/setsAreEqual.js'

export { default as toKebabCase } from '../utilities/toKebabCase.js'

export { unflatten } from '../utilities/unflatten.js'

export { wait } from '../utilities/wait.js'

export { default as wordBoundariesRegex } from '../utilities/wordBoundariesRegex.js'
export { versionDefaults } from '../versions/defaults.js'
export { deepMergeSimple } from '@payloadcms/translations/utilities'
