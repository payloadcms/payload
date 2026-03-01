export {
  generateCookie,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getCookieExpiration,
  parseCookies,
} from '../auth/cookies.js'

export { getLoginOptions } from '../auth/getLoginOptions.js'
export { addSessionToUser, removeExpiredSessions } from '../auth/sessions.js'
export { getFromImportMap } from '../bin/generateImportMap/utilities/getFromImportMap.js'
export { parsePayloadComponent } from '../bin/generateImportMap/utilities/parsePayloadComponent.js'
export { defaults as collectionDefaults } from '../collections/config/defaults.js'
export {
  BASE_36_DIGITS,
  generateKeyBetween,
  generateNKeysBetween,
} from '../config/orderable/fractional-indexing.js'

export { serverProps } from '../config/types.js'

export { type Slugify } from '../fields/baseFields/slug/index.js'

export { defaultTimezones } from '../fields/baseFields/timezone/defaultTimezones.js'

export {
  fieldAffectsData,
  fieldHasMaxDepth,
  fieldHasSubFields,
  fieldIsArrayType,
  fieldIsBlockType,
  fieldIsGroupType,
  fieldIsHiddenOrDisabled,
  fieldIsID,
  fieldIsLocalized,
  fieldIsPresentationalOnly,
  fieldIsSidebar,
  fieldIsVirtual,
  fieldShouldBeLocalized,
  fieldSupportsMany,
  groupHasName,
  optionIsObject,
  optionIsValue,
  optionsAreObjects,
  tabHasName,
  valueIsValueWithRelation,
} from '../fields/config/types.js'

export { getFieldPaths } from '../fields/getFieldPaths.js'
export * from '../fields/validations.js'

export type {
  FolderBreadcrumb,
  FolderDocumentItemKey,
  FolderEnabledColection,
  FolderInterface,
  FolderOrDocument,
  GetFolderDataResult,
  Subfolder,
} from '../folders/types.js'

export { buildFolderWhereConstraints } from '../folders/utils/buildFolderWhereConstraints.js'
export { formatFolderOrDocumentItem } from '../folders/utils/formatFolderOrDocumentItem.js'
export { PREFERENCE_KEYS } from '../preferences/keys.js'

export { validOperators, validOperatorSet } from '../types/constants.js'

export { formatFilesize } from '../uploads/formatFilesize.js'
export { isImage } from '../uploads/isImage.js'
export { appendUploadSelectFields } from '../utilities/appendUploadSelectFields.js'
export { applyLocaleFiltering } from '../utilities/applyLocaleFiltering.js'

export { combineWhereConstraints } from '../utilities/combineWhereConstraints.js'

export {
  deepCopyObject,
  deepCopyObjectComplex,
  deepCopyObjectSimple,
  deepCopyObjectSimpleWithoutReactComponents,
} from '../utilities/deepCopyObject.js'
export {
  deepMerge,
  deepMergeWithCombinedArrays,
  deepMergeWithReactComponents,
  deepMergeWithSourceArrays,
} from '../utilities/deepMerge.js'

export { extractID } from '../utilities/extractID.js'

export { flattenAllFields } from '../utilities/flattenAllFields.js'
export { flattenTopLevelFields } from '../utilities/flattenTopLevelFields.js'
export { formatAdminURL } from '../utilities/formatAdminURL.js'
export { formatLabels, toWords } from '../utilities/formatLabels.js'

export { getBestFitFromSizes } from '../utilities/getBestFitFromSizes.js'
export { getDataByPath } from '../utilities/getDataByPath.js'
export { getFieldPermissions } from '../utilities/getFieldPermissions.js'
export { getFormStateDataByPath } from '../utilities/getFormStateDataByPath.js'
export { getObjectDotNotation } from '../utilities/getObjectDotNotation.js'

export { getSafeRedirect } from '../utilities/getSafeRedirect.js'

export { getSelectMode } from '../utilities/getSelectMode.js'

export { getSiblingData } from '../utilities/getSiblingData.js'

export { getUniqueListBy } from '../utilities/getUniqueListBy.js'

export {
  getAutosaveInterval,
  getVersionsMax,
  hasAutosaveEnabled,
  hasDraftsEnabled,
  hasDraftValidationEnabled,
  hasLocalizeStatusEnabled,
  hasScheduledPublishEnabled,
} from '../utilities/getVersionsConfig.js'

export { isNextBuild } from '../utilities/isNextBuild.js'

export { isNumber } from '../utilities/isNumber.js'

export { isPlainObject } from '../utilities/isPlainObject.js'

export {
  isReactClientComponent,
  isReactComponentOrFunction,
  isReactServerComponentOrFunction,
} from '../utilities/isReactComponent.js'

export {
  hoistQueryParamsToAnd,
  mergeListSearchAndWhere,
} from '../utilities/mergeListSearchAndWhere.js'

export { reduceFieldsToValues } from '../utilities/reduceFieldsToValues.js'

export { sanitizeFilename } from '../utilities/sanitizeFilename.js'

export { sanitizeUserDataForEmail } from '../utilities/sanitizeUserDataForEmail.js'

export { setsAreEqual } from '../utilities/setsAreEqual.js'

export { slugify } from '../utilities/slugify.js'

export { toKebabCase } from '../utilities/toKebabCase.js'

export {
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from '../utilities/transformColumnPreferences.js'

export { transformWhereQuery } from '../utilities/transformWhereQuery.js'
export { unflatten } from '../utilities/unflatten.js'
export { validateMimeType } from '../utilities/validateMimeType.js'
export { validateWhereQuery } from '../utilities/validateWhereQuery.js'
export { wait } from '../utilities/wait.js'
export { wordBoundariesRegex } from '../utilities/wordBoundariesRegex.js'
export { versionDefaults } from '../versions/defaults.js'

export { deepMergeSimple } from '@payloadcms/translations/utilities'
