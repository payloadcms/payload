'use client'
import type { Option, OptionObject, SelectFieldClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo } from 'react'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { FieldLabel } from '../../../fields/FieldLabel/index.js'
import { useField } from '../../../forms/useField/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'recently-viewed-collections-field'

const normalizeOption = (option: Option): OptionObject =>
  typeof option === 'string' ? { label: option, value: option } : option

/**
 * Widget config field for the activity widget. The value is stored as an exclusion list
 * (`excludedCollections`), but the user sees an inclusion filter: every collection is checked by
 * default and unchecking one adds it to the stored exclusions. Storing exclusions means collections
 * added later are visible by default.
 */
export const RecentlyViewedCollectionsField: SelectFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
}) => {
  const { label } = field
  const { path, setValue, value } = useField<string[]>({ potentiallyStalePath: pathFromProps })
  const { i18n } = useTranslation()

  const excludedSlugs = useMemo(() => new Set<string>(Array.isArray(value) ? value : []), [value])

  const options = useMemo(() => (field.options ?? []).map(normalizeOption), [field.options])

  const toggleCollection = useCallback(
    (slug: string, isIncluded: boolean) => {
      const nextExcluded = new Set(excludedSlugs)

      if (isIncluded) {
        nextExcluded.delete(slug)
      } else {
        nextExcluded.add(slug)
      }

      setValue(Array.from(nextExcluded))
    },
    [excludedSlugs, setValue],
  )

  return (
    <div className={baseClass}>
      <FieldLabel as="span" label={label} path={path} />
      <ul className={`${baseClass}__list`}>
        {options.map((option) => {
          const isIncluded = !excludedSlugs.has(option.value)

          return (
            <li className={`${baseClass}__option`} key={option.value}>
              <CheckboxInput
                checked={isIncluded}
                label={getTranslation(option.label, i18n)}
                name={`${path}__${option.value}`}
                onToggle={(event) => toggleCollection(option.value, event.target.checked)}
                readOnly={readOnly}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
