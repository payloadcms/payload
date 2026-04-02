import type { ParsedQs } from 'qs-esm'

export type SearchFilterProps = {
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  fieldName?: string
  handleChange?: (search: string) => void
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * Prefer passing in `searchString` instead.
   *
   * @deprecated
   */
  initialParams?: ParsedQs
  label: string
  searchQueryParam?: string
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  setValue?: (arg: string) => void
  /**
   * This prop is deprecated and will be removed in the next major version.
   *
   * @deprecated
   */
  value?: string
}
