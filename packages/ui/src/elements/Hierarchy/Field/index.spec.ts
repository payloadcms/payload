import type {
  FilterOptionsResult,
  RelationshipFieldClientProps,
  SanitizedHierarchyConfig,
} from 'payload'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HierarchyModalProps } from '../Modal/types.js'

const state = vi.hoisted(() => ({
  disabled: false,
  filterOptions: undefined as FilterOptionsResult | undefined,
  hierarchyConfig: undefined as
    | Pick<SanitizedHierarchyConfig, 'collectionSpecific' | 'relatedCollections'>
    | undefined,
  onSave: undefined as HierarchyModalProps['onSave'] | undefined,
  setValue: vi.fn(),
}))

vi.mock('@payloadcms/translations', () => ({ getTranslation: (label: string) => label }))
vi.mock('../../../fields/mergeFieldStyles.js', () => ({ mergeFieldStyles: () => ({}) }))
vi.mock('../../../fields/Relationship/Input.js', () => ({
  RelationshipInput: (props: {
    AddNewRelationButton: React.ReactNode
    AfterInput: React.ReactNode
    filterOptions?: FilterOptionsResult
  }) => {
    state.filterOptions = props.filterOptions
    return React.createElement(React.Fragment, null, props.AddNewRelationButton, props.AfterInput)
  },
}))
vi.mock('../../../forms/useField/index.js', () => ({
  useField: () => ({
    disabled: state.disabled,
    path: '_h_tags',
    setValue: state.setValue,
    value: [1],
  }),
}))
vi.mock('../../../icons/Tag/index.js', () => ({ TagIcon: () => null }))
vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    getEntityConfig: () => ({
      hierarchy: state.hierarchyConfig,
      labels: { plural: 'Tags', singular: 'Tag' },
    }),
  }),
}))
vi.mock('../../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ collectionSlug: 'posts' }),
}))
vi.mock('../../../providers/Hierarchy/index.js', () => ({
  useHierarchy: () => ({ baseFilter: null }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: {}, t: () => 'Select Tags' }),
}))
vi.mock('../../Button/index.js', () => ({
  Button: (props: { 'aria-label': string; disabled: boolean }) =>
    React.createElement('button', { 'aria-label': props['aria-label'], disabled: props.disabled }),
}))
vi.mock('../Modal/useHierarchyModal.js', () => ({
  useHierarchyModal: () => [
    (props: HierarchyModalProps) => {
      state.onSave = props.onSave
      return null
    },
    null,
    { openModal: vi.fn() },
  ],
}))

import { HierarchyFieldClient } from './index.client.js'

const field: RelationshipFieldClientProps['field'] = {
  name: '_h_tags',
  type: 'relationship',
  hasMany: true,
  label: 'Tags',
  relationTo: 'tags',
}

describe('hierarchy field modal writes', () => {
  beforeEach(() => {
    state.disabled = false
    state.hierarchyConfig = undefined
    state.setValue.mockClear()
  })

  it.each(['readOnly', 'disabled'] as const)(
    'should disable browsing and reject modal writes when %s',
    (mode) => {
      state.disabled = mode === 'disabled'

      const markup = renderToStaticMarkup(
        React.createElement(HierarchyFieldClient, { field, readOnly: mode === 'readOnly' }),
      )
      const closeModal = vi.fn()

      expect(markup).toContain('disabled=""')
      state.onSave?.({ closeModal, selections: new Map([[2, { id: 2, path: [] }]]) })
      expect(state.setValue).not.toHaveBeenCalled()
      expect(closeModal).toHaveBeenCalledOnce()
    },
  )

  it('should apply modal selections when the field is editable', () => {
    const markup = renderToStaticMarkup(React.createElement(HierarchyFieldClient, { field }))

    expect(markup).not.toContain('disabled=""')
    state.onSave?.({ closeModal: vi.fn(), selections: new Map([[2, { id: 2, path: [] }]]) })
    expect(state.setValue).toHaveBeenCalledWith([2])
  })

  it('should pass the document collection restrictions to the relationship dropdown', () => {
    state.hierarchyConfig = {
      collectionSpecific: { fieldName: 'allowedTypes' },
      relatedCollections: {
        pages: { fieldName: '_h_tags', hasMany: true },
        posts: { fieldName: '_h_tags', hasMany: true },
      },
    }

    renderToStaticMarkup(React.createElement(HierarchyFieldClient, { field }))

    expect(state.filterOptions?.tags).toMatchObject({
      and: [{ or: expect.arrayContaining([{ allowedTypes: { in: ['posts'] } }]) }],
    })
  })
})
