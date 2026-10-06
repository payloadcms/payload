'use client'

import type { RelationshipFieldClientProps, ValueWithRelation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback, useMemo } from 'react'

import type { Option, OptionGroup } from '../../../fields/Relationship/types.js'
import type { SelectionWithPath } from '../Modal/types.js'

import { mergeFieldStyles } from '../../../../shared/fields/mergeFieldStyles.js'
import { RelationshipInput } from '../../../fields/Relationship/Input.js'
import { useField } from '../../../forms/useField/index.js'
import { TagIcon } from '../../../../shared/icons/Tag/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'
import { getHierarchyFilterOptions } from './getHierarchyFilterOptions.js'
import './index.css'

const baseClass = 'hierarchy-field'
type Value = (number | string)[] | null | (number | string)

const flattenOptionGroups = (groups: OptionGroup[]): Option[] =>
  groups.flatMap((group) => group.options)

export type HierarchyFieldClientProps = { Icon?: React.ReactNode } & RelationshipFieldClientProps

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
  const { baseFilter } = useHierarchy()
  const { i18n, t } = useTranslation()
  const collectionConfig = getEntityConfig({ collectionSlug: hierarchySlug })
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const titlePathFieldName = hierarchyConfig?.titlePathFieldName
  const memoizedValidate = useCallback(
    (value: Value, validationOptions: Parameters<typeof validate>[1]) =>
      typeof validate === 'function'
        ? validate(value, { ...validationOptions, required })
        : undefined,
    [required, validate],
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
  } = useField<Value>({ potentiallyStalePath: pathFromProps, validate: memoizedValidate })
  const isReadOnly = readOnly || field.admin?.readOnly || disabled
  const hierarchyFilterOptions = useMemo(
    () =>
      getHierarchyFilterOptions({
        baseFilter,
        documentCollectionSlug,
        filterOptions,
        hierarchyConfig,
        hierarchySlug,
      }),
    [baseFilter, documentCollectionSlug, filterOptions, hierarchyConfig, hierarchySlug],
  )
  const [relationTo] = React.useState(() => [hierarchySlug])
  const styles = useMemo(() => mergeFieldStyles(field), [field])
  const toRelationValues = useCallback(
    (ids: Value): null | ValueWithRelation | ValueWithRelation[] => {
      if (hasMany) {
        return Array.isArray(ids)
          ? ids.map((id) => ({ relationTo: hierarchySlug, value: id }))
          : null
      }
      return ids === null || typeof ids === 'undefined'
        ? null
        : { relationTo: hierarchySlug, value: ids as number | string }
    },
    [hasMany, hierarchySlug],
  )
  const relationshipValue = useMemo(() => toRelationValues(value), [toRelationValues, value])
  const relationshipInitialValue = useMemo(
    () => toRelationValues(initialValue),
    [initialValue, toRelationValues],
  )
  const initialSelections = useMemo(
    () =>
      value === null || typeof value === 'undefined' ? [] : Array.isArray(value) ? value : [value],
    [value],
  )
  const filterByCollection = useMemo(
    () => (documentCollectionSlug ? [documentCollectionSlug] : undefined),
    [documentCollectionSlug],
  )
  const [HierarchyModal, , { openModal }] = useHierarchyModal({
    filterByCollection,
    hierarchyCollectionSlug: hierarchySlug,
    Icon,
  })
  const handleModalSave = useCallback(
    ({
      closeModal,
      selections,
    }: {
      closeModal: () => void
      selections: Map<number | string, SelectionWithPath>
    }) => {
      if (isReadOnly) {
        closeModal()
        return
      }
      const ids = Array.from(selections.keys())
      setValue(hasMany ? ids : (ids[0] ?? null))
      closeModal()
    },
    [hasMany, isReadOnly, setValue],
  )
  const handleChangeHasMany = useCallback(
    (newValue: ValueWithRelation[]) => {
      const ids = newValue?.map((item) => item.value) ?? []
      setValue(
        ids,
        Array.isArray(value) &&
          ids.length === value.length &&
          value.every((id, i) => id === ids[i]),
      )
    },
    [setValue, value],
  )
  const handleChangeSingle = useCallback(
    (newValue: ValueWithRelation) => setValue(newValue?.value ?? null, value === newValue?.value),
    [setValue, value],
  )
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
      if (context !== 'menu' || typeof doc?.[titlePathFieldName ?? ''] !== 'string') {
        return defaultLabel
      }
      const titlePath = doc[titlePathFieldName ?? '']
      return typeof titlePath === 'string'
        ? titlePath
            .split('/')
            .map((part) => part.trim())
            .join(' / ')
        : defaultLabel
    },
    [titlePathFieldName],
  )
  const hierarchyLabel =
    getTranslation(
      hasMany ? collectionConfig?.labels?.plural : collectionConfig?.labels?.singular,
      i18n,
    ) || hierarchySlug
  const BrowseButton = useMemo(
    () => (
      <Button
        aria-label={t('general:selectLabel', { label: hierarchyLabel })}
        buttonStyle="secondary"
        className={`${baseClass}__browse-button`}
        disabled={isReadOnly}
        icon={Icon ?? <TagIcon />}
        margin={false}
        onClick={openModal}
        size="large"
      />
    ),
    [Icon, hierarchyLabel, isReadOnly, openModal, t],
  )

  return (
    <RelationshipInput
      AddNewRelationButton={BrowseButton}
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
      Description={Description}
      description={description}
      Error={Error}
      filterOptions={hierarchyFilterOptions}
      formatDisplayedOptions={flattenOptionGroups}
      formatOptionLabel={formatOptionLabel}
      isSortable={isSortable}
      Label={Label}
      label={label}
      localized={localized}
      maxResultsPerRequest={10}
      path={path}
      placeholder={placeholder}
      readOnly={isReadOnly}
      relationTo={relationTo}
      required={required}
      selectOptionFields={selectOptionFields}
      showError={showError}
      style={styles}
      {...(hasMany === true
        ? {
            hasMany: true,
            initialValue: relationshipInitialValue as ValueWithRelation[],
            onChange: handleChangeHasMany,
            value: relationshipValue as ValueWithRelation[],
          }
        : {
            hasMany: false,
            initialValue: relationshipInitialValue as ValueWithRelation,
            onChange: handleChangeSingle,
            value: relationshipValue as ValueWithRelation,
          })}
    />
  )
}
