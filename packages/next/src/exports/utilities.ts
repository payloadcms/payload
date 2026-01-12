// NOTICE: Server-only utilities, do not import anything client-side here.

export { getNextRequestI18n } from '../utilities/getNextRequestI18n.js'
export { getPayloadHMR } from '../utilities/getPayloadHMR.js'

import {
  addDataAndFileToRequest as _addDataAndFileToRequest,
  addLocalesToRequestFromData as _addLocalesToRequestFromData,
  createPayloadRequest as _createPayloadRequest,
  headersWithCors as _headersWithCors,
  mergeHeaders as _mergeHeaders,
  sanitizeLocales as _sanitizeLocales,
} from 'payload'

/**
 * Use:
 * ```ts
 * import { mergeHeaders } from 'payload'
 * ```
 * @deprecated
 */
export const mergeHeaders = _mergeHeaders

/**
 * @deprecated
 * Use:
 * ```ts
 * import { headersWithCors } from 'payload'
 * ```
 */
export const headersWithCors = _headersWithCors

/**
 * @deprecated
 * Use:
 * ```ts
 * import { createPayloadRequest } from 'payload'
 * ```
 */
export const createPayloadRequest = _createPayloadRequest

/**
 * @deprecated
 * Use:
 * ```ts
 * import { addDataAndFileToRequest } from 'payload'
 * ```
 */
export const addDataAndFileToRequest = _addDataAndFileToRequest

/**
 * @deprecated
 * Use:
 * ```ts
 * import { sanitizeLocales } from 'payload'
 * ```
 */
export const sanitizeLocales = _sanitizeLocales

/**
 * @deprecated
 * Use:
 * ```ts
 * import { addLocalesToRequestFromData } from 'payload'
 * ```
 */
export const addLocalesToRequestFromData = _addLocalesToRequestFromData
