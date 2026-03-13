'use client'
import type { RelationshipFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo } from 'react'

import type { SelectionWithPath } from '../HierarchyDrawer/types.js'

import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { mergeFieldStyles } from '../../fields/mergeFieldStyles.js'
import { fieldBaseClass } from '../../fields/shared/index.js'
import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
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
  const { collectionSlug: documentCollectionSlug } = useDocumentInfo()
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

  // Initialize selections for the drawer - use current value so drawer expands to current selection
  const initialSelections = useMemo(() => {
    if (!value) {
      return []
    }

    if (Array.isArray(value)) {
      return value
    }

    return [value] as (number | string)[]
  }, [value])

  // Memoize to prevent new array references on every render
  const filterByCollection = useMemo(
    () => (documentCollectionSlug ? [documentCollectionSlug] : undefined),
    [documentCollectionSlug],
  )

  const [HierarchyDrawer, , { openDrawer }] = useHierarchyDrawer({
    filterByCollection,
    hierarchyCollectionSlug: hierarchySlug,
    Icon,
  })

  const handleDrawerSave = useCallback(
    ({
      closeDrawer,
      selections,
    }: {
      closeDrawer: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      const ids = Array.from(selections.keys())
      const newValue = hasMany ? ids : (ids[0] ?? null)
      setValue(newValue)
      closeDrawer()
    },
    [hasMany, setValue],
  )

  const handleRemove = useCallback(
    ({ id: idToRemove }: { id: number | string }) => {
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

  const hierarchyLabel =
    getTranslation(
      hasMany ? collectionConfig?.labels?.plural : collectionConfig?.labels?.singular,
      i18n,
    ) || hierarchySlug

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
          {selectedIds.length > 0 && (
            <SelectedHierarchies
              hierarchySlug={hierarchySlug}
              onRemove={handleRemove}
              readOnly={readOnly || disabled}
              selectedIds={selectedIds}
            />
          )}
          {hasMany && selectedIds.length === 0 && (
            <span className={`${baseClass}__placeholder`}>
              {t('general:noLabel', { label: hierarchyLabel })}
            </span>
          )}
          {!readOnly && (hasMany || selectedIds.length === 0) && (
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
              {t('general:selectLabel', { label: hierarchyLabel })}
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
