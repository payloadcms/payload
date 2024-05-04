/**
 * WARNING: This file contains exports that can only be safely used on the front-end
 */

export { createDataloaderCacheKey, getDataLoader } from '../collections/dataloader.js'
export { default as getDefaultValue } from '../fields/getDefaultValue.js'
export { traverseFields as afterChangeTraverseFields } from '../fields/hooks/afterChange/traverseFields.js'
export { promise as afterReadPromise } from '../fields/hooks/afterRead/promise.js'
export { traverseFields as afterReadTraverseFields } from '../fields/hooks/afterRead/traverseFields.js'
export { traverseFields as beforeChangeTraverseFields } from '../fields/hooks/beforeChange/traverseFields.js'
export { traverseFields as beforeValidateTraverseFields } from '../fields/hooks/beforeValidate/traverseFields.js'

export { formatFilesize } from '../uploads/formatFilesize.js'

export { default as isImage } from '../uploads/isImage.js'

export { combineMerge } from '../utilities/combineMerge.js'
export {
  configToJSONSchema,
  entityToJSONSchema,
  fieldsToJSONSchema,
  withNullableJSONSchemaType,
} from '../utilities/configToJSONSchema.js'

export { createArrayFromCommaDelineated } from '../utilities/createArrayFromCommaDelineated.js'
export { createLocalReq } from '../utilities/createLocalReq.js'
export { deepCopyObject } from '../utilities/deepCopyObject.js'

export { deepMerge } from '../utilities/deepMerge.js'
export { fieldSchemaToJSON } from '../utilities/fieldSchemaToJSON.js'

export { default as flattenTopLevelFields } from '../utilities/flattenTopLevelFields.js'

export { formatLabels, formatNames, toWords } from '../utilities/formatLabels.js'
export { getCollectionIDFieldTypes } from '../utilities/getCollectionIDFieldTypes.js'
export { getObjectDotNotation } from '../utilities/getObjectDotNotation.js'

export { default as getUniqueListBy } from '../utilities/getUniqueListBy.js'

export { isEntityHidden } from '../utilities/isEntityHidden.js'
export { isNumber } from '../utilities/isNumber.js'

export { isPlainObject } from '../utilities/isPlainObject.js'
export {
  isPlainFunction,
  isReactClientComponent,
  isReactComponent,
  isReactServerComponent,
} from '../utilities/isReactComponent.js'
export { isValidID } from '../utilities/isValidID.js'

export { default as isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
export { mapAsync } from '../utilities/mapAsync.js'
export { mergeListSearchAndWhere } from '../utilities/mergeListSearchAndWhere.js'
export { setsAreEqual } from '../utilities/setsAreEqual.js'
export { default as toKebabCase } from '../utilities/toKebabCase.js'
export { wait } from '../utilities/wait.js'
export { default as wordBoundariesRegex } from '../utilities/wordBoundariesRegex.js'
