export { EntityType } from '../admin/views/dashboard.js'

export {
  generateCookie,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getCookieExpiration,
  parseCookies,
} from '../auth/cookies.js'

export { extractAccessFromPermission } from '../auth/extractAccessFromPermission.js'
export { extractJWT } from '../auth/extractJWT.js'
export { getLoginOptions } from '../auth/getLoginOptions.js'
export { addSessionToUser, removeExpiredSessions } from '../auth/sessions.js'

export { getFromImportMap } from '../bin/generateImportMap/utilities/getFromImportMap.js'
export { parsePayloadComponent } from '../bin/generateImportMap/utilities/parsePayloadComponent.js'
export {
  type ClientCollectionConfig,
  createClientCollectionConfig,
  createClientCollectionConfigs,
  type ServerOnlyCollectionAdminProperties,
  type ServerOnlyCollectionProperties,
  type ServerOnlyUploadProperties,
} from '../collections/config/client.js'
export { defaults as collectionDefaults } from '../collections/config/defaults.js'

export {
  type ClientConfig,
  createClientConfig,
  type CreateClientConfigArgs,
  createUnauthenticatedClientConfig,
  type ServerOnlyRootAdminProperties,
  type ServerOnlyRootProperties,
  type UnauthenticatedClientConfig,
} from '../config/client.js'
export {
  BASE_36_DIGITS,
  generateKeyBetween,
  generateNKeysBetween,
} from '../config/orderable/fractional-indexing.js'
export { serverProps } from '../config/types.js'
export { combineQueries } from '../database/combineQueries.js'

export { APIError, APIErrorName } from '../errors/APIError.js'
export { MissingEditorProp } from '../errors/MissingEditorProp.js'

export { UnauthorizedError } from '../errors/UnauthorizedError.js'

export { type Slugify } from '../fields/baseFields/slug/index.js'

export { defaultTimezones } from '../fields/baseFields/timezone/defaultTimezones.js'

export {
  createClientBlocks,
  createClientField,
  createClientFields,
} from '../fields/config/client.js'

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
export { getDefaultValue } from '../fields/getDefaultValue.js'
export { getFieldPaths } from '../fields/getFieldPaths.js'
export { isFieldDisabled } from '../fields/isFieldDisabled.js'
export type { DisabledArea, DisabledOptions } from '../fields/isFieldDisabled.js'

export * from '../fields/validations.js'

export {
  type ClientGlobalConfig,
  createClientGlobalConfig,
  createClientGlobalConfigs,
  type ServerOnlyGlobalAdminProperties,
  type ServerOnlyGlobalProperties,
} from '../globals/config/client.js'

export {
  DEFAULT_HIERARCHY_LIST_LIMIT,
  DEFAULT_HIERARCHY_TREE_LIMIT,
  getHierarchyFieldName,
} from '../hierarchy/constants.js'

export type { ClientHierarchyConfig, FolderBreadcrumb } from '../hierarchy/types.js'
export { PREFERENCE_KEYS } from '../preferences/keys.js'

export { validOperators, validOperatorSet } from '../types/constants.js'
export { formatFilesize } from '../uploads/formatFilesize.js'
export { isImage } from '../uploads/isImage.js'

export { appendDateTimezoneSelectFields } from '../utilities/appendDateTimezoneSelectFields.js'
export { appendUploadSelectFields } from '../utilities/appendUploadSelectFields.js'

export { applyLocaleFiltering } from '../utilities/applyLocaleFiltering.js'

export { canAccessAdmin } from '../utilities/canAccessAdmin.js'

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
export { formatErrors } from '../utilities/formatErrors.js'

export { formatLabels, toWords } from '../utilities/formatLabels.js'
export { getBestFitFromSizes } from '../utilities/getBestFitFromSizes.js'
export { getBlockSelect } from '../utilities/getBlockSelect.js'
export { getDataByPath } from '../utilities/getDataByPath.js'
export { getFieldPermissions } from '../utilities/getFieldPermissions.js'

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

export { isEntityHidden } from '../utilities/isEntityHidden.js'

export { isNextBuild } from '../utilities/isNextBuild.js'

export { isNumber } from '../utilities/isNumber.js'

export { isPlainObject } from '../utilities/isPlainObject.js'

export {
  isReactClientComponent,
  isReactComponentOrFunction,
  isReactServerComponentOrFunction,
} from '../utilities/isReactComponent.js'

export { isRSCEnabled } from '../utilities/isRSCEnabled.js'

export { logError } from '../utilities/logError.js'

export {
  hoistQueryParamsToAnd,
  mergeListSearchAndWhere,
} from '../utilities/mergeListSearchAndWhere.js'

export { parseDocumentID } from '../utilities/parseDocumentID.js'

export { reduceFieldsToValues } from '../utilities/reduceFieldsToValues.js'

export { sanitizeFilename } from '../utilities/sanitizeFilename.js'

export { sanitizeUrl } from '../utilities/sanitizeUrl.js'

export { sanitizeUserDataForEmail } from '../utilities/sanitizeUserDataForEmail.js'

export { setsAreEqual } from '../utilities/setsAreEqual.js'

export { slugify } from '../utilities/slugify.js'

export { stripUnselectedFields } from '../utilities/stripUnselectedFields.js'

export { toKebabCase } from '../utilities/toKebabCase.js'

export {
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from '../utilities/transformColumnPreferences.js'

export { transformWhereQuery } from '../utilities/transformWhereQuery.js'

export { traverseFields } from '../utilities/traverseFields.js'
export { unflatten } from '../utilities/unflatten.js'
export { validateMimeType } from '../utilities/validateMimeType.js'
export { validateWhereQuery } from '../utilities/validateWhereQuery.js'
export { wait } from '../utilities/wait.js'
export { wordBoundariesRegex } from '../utilities/wordBoundariesRegex.js'
export { versionDefaults } from '../versions/defaults.js'

export { deepMergeSimple } from '@payloadcms/translations/utilities'
