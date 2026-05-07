import { status as httpStatus } from 'http-status'

import { APIError } from './APIError.js'

/**
 * Thrown when an attempt to apply a template against a collection / block / field
 * detects that the template's stored schema fingerprint no longer matches the live
 * schema. The template is also stamped with `_isStale: true` as a side effect of
 * the throw so that future picker queries filter it out.
 *
 * @experimental
 * @see https://github.com/payloadcms/payload/discussions/16515
 */
export class TemplateOutOfDateError extends APIError {
  templateID: number | string
  templateTitle?: string

  constructor({
    templateID,
    templateTitle,
  }: {
    templateID: number | string
    templateTitle?: string
  }) {
    const label = templateTitle ? `"${templateTitle}"` : `(id: ${templateID})`
    super(
      `Template ${label} is out of date. Edit it to bring it up to date with the current schema, or delete it.`,
      httpStatus.CONFLICT,
    )
    this.templateID = templateID
    this.templateTitle = templateTitle
  }
}
