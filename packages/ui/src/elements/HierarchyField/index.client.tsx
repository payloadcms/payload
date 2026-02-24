'use client'
import type { RelationshipFieldClientProps } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { useCallback, useMemo } from 'react'

import type { SelectionWithPath } from '../HierarchyDrawer/types.js'

import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { mergeFieldStyles } from '../../fields/mergeFieldStyles.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { useHierarchyDrawer } from '../HierarchyDrawer/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { SelectedHierarchies } from './SelectedHierarchies.js'
import './index.scss'

const baseClass = 'hierarchy-field'

type Value = (number | string)[] | null | (number | string)

export type HierarchyFieldClientProps = {
  Icon?: React.ReactNode
} & RelationshipFieldClientProps

export const HierarchyFieldClient: React.FC<HierarchyFieldClientProps> = (props) => {
  const {
    field,
    field: {
      admin: { className, description } = {},
      hasMany,
      label,
      localized,
      relationTo: relationToProp,
      required,
    },
    Icon,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const hierarchySlug = Array.isArray(relationToProp) ? relationToProp[0] : relationToProp

  const { getEntityConfig } = useConfig()
  const { i18n, t } = useTranslation()

  const collectionConfig = getEntityConfig({ collectionSlug: hierarchySlug })

  const memoizedValidate = useCallback(
    (value: Value, validationOptions: Parameters<typeof validate>[1]) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<Value>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  // Normalize value to array of IDs for display
  const selectedIds = useMemo((): (number | string)[] => {
    if (!value) {
      return []
    }

    if (Array.isArray(value)) {
      return value
    }

    return [value]
  }, [value])

  // Initialize selections for the drawer
  const initialSelections = useMemo(() => {
    if (!initialValue) {
      return []
    }

    if (Array.isArray(initialValue)) {
      return initialValue
    }

    return [initialValue] as (number | string)[]
  }, [initialValue])

  const [HierarchyDrawer, , { openDrawer }] = useHierarchyDrawer({
    collectionSlug: hierarchySlug,
    Icon,
  })

  const handleDrawerSave = useCallback(
    (selections: Map<number | string, SelectionWithPath>, closeDrawer: () => void) => {
      const ids = Array.from(selections.keys())
      const newValue = hasMany ? ids : (ids[0] ?? null)
      setValue(newValue)
      closeDrawer()
    },
    [hasMany, setValue],
  )

  const handleRemove = useCallback(
    (idToRemove: number | string) => {
      if (hasMany) {
        const newIds = selectedIds.filter((id) => id !== idToRemove)
        setValue(newIds.length > 0 ? newIds : null)
      } else {
        setValue(null)
      }
    },
    [hasMany, selectedIds, setValue],
  )

  const handleOpenDrawer = useCallback(() => {
    openDrawer()
  }, [openDrawer])

  const hierarchyLabel = collectionConfig?.labels?.plural
    ? getTranslation(collectionConfig.labels.plural, i18n)
    : hierarchySlug

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        <div className={`${baseClass}__content`}>
          <SelectedHierarchies
            hierarchySlug={hierarchySlug}
            onRemove={handleRemove}
            readOnly={readOnly || disabled}
            selectedIds={selectedIds}
          />
          {!readOnly && (
            <Button
              buttonStyle="dashed"
              className={`${baseClass}__manage-button`}
              disabled={disabled}
              icon="plus"
              iconPosition="left"
              margin={false}
              onClick={handleOpenDrawer}
              size="small"
            >
              {t('general:select')} {hierarchyLabel}
            </Button>
          )}
        </div>
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
      <HierarchyDrawer
        hasMany={hasMany}
        initialSelections={initialSelections}
        onSave={handleDrawerSave}
      />
    </div>
  )
}
