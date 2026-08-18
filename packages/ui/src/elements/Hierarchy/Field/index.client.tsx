'use client'
import type { RelationshipFieldClientProps, ValueWithRelation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback, useMemo } from 'react'

import type { Option, OptionGroup } from '../../../fields/Relationship/types.js'
import type { SelectionWithPath } from '../Modal/types.js'

import { mergeFieldStyles } from '../../../fields/mergeFieldStyles.js'
import { RelationshipInput } from '../../../fields/Relationship/Input.js'
import { useField } from '../../../forms/useField/index.js'
import { TagIcon } from '../../../icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'
import './index.css'

const baseClass = 'hierarchy-field'

type Value = (number | string)[] | null | (number | string)

/** The hierarchy is monomorphic, so the grouped options can be flattened into a single list */
const flattenOptionGroups = (groups: OptionGroup[]): Option[] =>
  groups.map((group) => group.options).flat()

export type HierarchyFieldClientProps = {
  Icon?: React.ReactNode
} & RelationshipFieldClientProps

/**
 * Renders a hierarchy relationship (e.g. tags) as a standard relationship input, swapping the
 * "create new document" button for one that opens the hierarchy column browser. Options are
 * labelled with their full ancestor path while browsing so same-named items stay distinguishable.
 */
export const HierarchyFieldClient: React.FC<HierarchyFieldClientProps> = (props) => {
  const {
    field,
    field: {
      admin: { className, description, isSortable = true, placeholder } = {},
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
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const titlePathFieldName = hierarchyConfig?.titlePathFieldName

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
    filterOptions,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<Value>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const [relationTo] = React.useState(() => [hierarchySlug])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  const toRelationValues = useCallback(
    (ids: Value): null | ValueWithRelation | ValueWithRelation[] => {
      if (hasMany) {
        return Array.isArray(ids)
          ? ids.map((id) => ({ relationTo: hierarchySlug, value: id }))
          : null
      }

      return ids ? { relationTo: hierarchySlug, value: ids as number | string } : null
    },
    [hasMany, hierarchySlug],
  )

  const memoizedValue = useMemo(() => toRelationValues(value), [toRelationValues, value])

  const memoizedInitialValue = useMemo(
    () => toRelationValues(initialValue),
    [initialValue, toRelationValues],
  )

  const handleChangeHasMany = useCallback(
    (newValue: ValueWithRelation[]) => {
      const ids = Array.isArray(newValue) ? newValue.map((relation) => relation.value) : []

      const isUnchanged =
        Array.isArray(value) &&
        value.length === ids.length &&
        value.every((id, index) => id === ids[index])

      setValue(ids, isUnchanged)
    },
    [setValue, value],
  )

  const handleChangeSingle = useCallback(
    (newValue: ValueWithRelation) => {
      const id = newValue?.value ?? null
      setValue(id, value === id)
    },
    [setValue, value],
  )

  // Selecting the virtual path field is what triggers the server to compute it
  const selectOptionFields = useMemo(
    () => (titlePathFieldName ? { [titlePathFieldName]: true } : undefined),
    [titlePathFieldName],
  )

  const formatOptionLabel = useCallback(
    ({
      context,
      defaultLabel,
      doc,
    }: {
      context: 'menu' | 'value'
      defaultLabel: string
      doc?: Record<string, unknown>
    }) => {
      if (context !== 'menu' || !titlePathFieldName) {
        return defaultLabel
      }

      const titlePath = doc?.[titlePathFieldName]

      if (typeof titlePath !== 'string' || !titlePath) {
        return defaultLabel
      }

      return titlePath
        .split('/')
        .map((segment) => segment.trim())
        .join(' / ')
    },
    [titlePathFieldName],
  )

  // Memoize to prevent new array references on every render
  const filterByCollection = useMemo(
    () => (documentCollectionSlug ? [documentCollectionSlug] : undefined),
    [documentCollectionSlug],
  )

  const [HierarchyModal, , { openModal }] = useHierarchyModal({
    filterByCollection,
    hierarchyCollectionSlug: hierarchySlug,
    Icon,
  })

  // Pass the current value so the browser opens expanded to what is already selected
  const initialSelections = useMemo((): (number | string)[] => {
    if (!value) {
      return []
    }

    return Array.isArray(value) ? value : [value]
  }, [value])

  const handleModalSave = useCallback(
    ({
      closeModal,
      selections,
    }: {
      closeModal: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      const ids = Array.from(selections.keys())
      setValue(hasMany ? ids : (ids[0] ?? null))
      closeModal()
    },
    [hasMany, setValue],
  )

  const hierarchyLabel =
    getTranslation(
      hasMany ? collectionConfig?.labels?.plural : collectionConfig?.labels?.singular,
      i18n,
    ) || hierarchySlug

  const selectLabel = t('general:selectLabel', { label: hierarchyLabel })

  const BrowseButton = useMemo(
    () => (
      <Button
        aria-label={selectLabel}
        buttonStyle="secondary"
        className={`${baseClass}__browse-button`}
        disabled={disabled}
        icon={Icon ?? <TagIcon />}
        margin={false}
        onClick={openModal}
        size="large"
        tooltip={selectLabel}
      />
    ),
    [disabled, Icon, openModal, selectLabel],
  )

  return (
    <RelationshipInput
      AfterInput={
        <Fragment>
          {AfterInput}
          <HierarchyModal
            hasMany={hasMany}
            initialSelections={initialSelections}
            onSave={handleModalSave}
          />
        </Fragment>
      }
      allowEdit={false}
      BeforeInput={BeforeInput}
      className={[baseClass, className].filter(Boolean).join(' ')}
      CreateButton={BrowseButton}
      Description={Description}
      description={description}
      Error={Error}
      filterOptions={filterOptions}
      formatDisplayedOptions={flattenOptionGroups}
      formatOptionLabel={formatOptionLabel}
      isSortable={isSortable}
      Label={Label}
      label={label}
      localized={localized}
      maxResultsPerRequest={10}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly || disabled}
      relationTo={relationTo}
      required={required}
      selectOptionFields={selectOptionFields}
      showError={showError}
      style={styles}
      {...(hasMany === true
        ? {
            hasMany: true,
            initialValue: memoizedInitialValue as ValueWithRelation[],
            onChange: handleChangeHasMany,
            value: memoizedValue as ValueWithRelation[],
          }
        : {
            hasMany: false,
            initialValue: memoizedInitialValue as ValueWithRelation,
            onChange: handleChangeSingle,
            value: memoizedValue as ValueWithRelation,
          })}
    />
  )
}
