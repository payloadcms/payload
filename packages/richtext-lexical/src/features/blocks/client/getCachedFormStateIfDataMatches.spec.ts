import type { Data, FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { getCachedFormStateIfDataMatches } from './getCachedFormStateIfDataMatches.js'

describe('getCachedFormStateIfDataMatches', () => {
  it('should reuse cached form state when its values match the current block data', () => {
    const cachedFormState: FormState = {
      id: { initialValue: 'block-1', value: 'block-1' },
      images: {
        disableFormData: true,
        initialValue: 1,
        rows: [{ id: 'row-1' }],
        value: 1,
      },
      'images.0.id': { initialValue: 'row-1', value: 'row-1' },
      'images.0.image': { initialValue: 'image-1', value: 'image-1' },
      title: { initialValue: 'Gallery', value: 'Gallery' },
    }
    const formData: Data = {
      blockName: 'Gallery block',
      blockType: 'gallery',
      id: 'block-1',
      images: [{ id: 'row-1', image: 'image-1' }],
      title: 'Gallery',
    }

    expect(getCachedFormStateIfDataMatches({ cachedFormState, formData })).toBe(cachedFormState)
  })

  it('should rebuild form state when a simple array row was added', () => {
    const cachedFormState: FormState = {
      images: {
        disableFormData: true,
        initialValue: 1,
        rows: [{ id: 'row-1' }],
        value: 1,
      },
      'images.0.id': { initialValue: 'row-1', value: 'row-1' },
      'images.0.image': { initialValue: 'image-1', value: 'image-1' },
    }

    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState,
        formData: {
          images: [
            { id: 'row-1', image: 'image-1' },
            { id: 'row-2', image: 'image-2' },
          ],
        },
      }),
    ).toBe(false)
  })

  it('should rebuild form state for a first nested row without a cached row template', () => {
    const cachedFormState: FormState = {
      sections: {
        disableFormData: true,
        initialValue: 1,
        rows: [{ blockType: 'gallery', id: 'section-1' }],
        value: 1,
      },
      'sections.0.blockType': { initialValue: 'gallery', value: 'gallery' },
      'sections.0.id': { initialValue: 'section-1', value: 'section-1' },
      'sections.0.items': { initialValue: 0, rows: [], value: 0 },
    }

    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState,
        formData: {
          sections: [
            {
              blockType: 'gallery',
              id: 'section-1',
              items: [{ id: 'item-1', label: 'First item' }],
            },
          ],
        },
      }),
    ).toBe(false)
  })

  it('should rebuild form state when an object-valued row field lost a key', () => {
    const cachedFormState: FormState = {
      rows: {
        disableFormData: true,
        initialValue: 1,
        rows: [{ id: 'row-1' }],
        value: 1,
      },
      'rows.0.id': { initialValue: 'row-1', value: 'row-1' },
      'rows.0.settings': {
        initialValue: { keep: true, removed: 'stale' },
        value: { keep: true, removed: 'stale' },
      },
    }

    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState,
        formData: { rows: [{ id: 'row-1', settings: { keep: true } }] },
      }),
    ).toEqual({
      ...cachedFormState,
      'rows.0.settings': {
        initialValue: { keep: true },
        value: { keep: true },
      },
    })
  })

  it('should reuse cached field metadata with current scalar values', () => {
    const validate = () => true
    const cachedFormState: FormState = {
      title: {
        initialValue: 'Before save',
        passesCondition: true,
        valid: true,
        validate,
        value: 'Before save',
      },
    }

    const result = getCachedFormStateIfDataMatches({
      cachedFormState,
      formData: { title: 'After save' },
    })

    expect(result).toEqual({
      title: {
        initialValue: 'After save',
        passesCondition: true,
        valid: true,
        validate,
        value: 'After save',
      },
    })
    expect(cachedFormState.title.value).toBe('Before save')
  })

  it('should reuse cached row metadata when only values inside existing rows changed', () => {
    const cachedFormState: FormState = {
      items: {
        customComponents: { RowLabel: 'row-label' as never },
        disableFormData: true,
        initialValue: 1,
        rows: [{ id: 'row-1' }],
        value: 1,
      },
      'items.0.id': { initialValue: 'row-1', value: 'row-1' },
      'items.0.label': {
        passesCondition: true,
        initialValue: 'Before save',
        value: 'Before save',
      },
    }

    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState,
        formData: { items: [{ id: 'row-1', label: 'After save' }] },
      }),
    ).toEqual({
      ...cachedFormState,
      'items.0.label': {
        passesCondition: true,
        initialValue: 'After save',
        value: 'After save',
      },
    })
  })

  it.each([
    {
      cachedRow: { id: 'row-1' },
      currentRow: { id: 'row-2', label: 'After save' },
      name: 'row identity changed',
    },
    {
      cachedRow: { blockType: 'callout', id: 'row-1' },
      currentRow: { blockType: 'quote', id: 'row-1', label: 'After save' },
      name: 'block type changed',
    },
    {
      cachedRow: { id: 'row-1' },
      currentRow: { label: 'After save' },
      name: 'row identity disappeared',
    },
    {
      cachedRow: { blockType: 'callout', id: 'row-1' },
      currentRow: { id: 'row-1', label: 'After save' },
      name: 'block type disappeared',
    },
  ])('should rebuild form state when the $name', ({ cachedRow, currentRow }) => {
    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState: {
          items: { initialValue: 1, rows: [cachedRow], value: 1 },
          'items.0.label': { initialValue: 'Before save', value: 'Before save' },
        },
        formData: { items: [currentRow] },
      }),
    ).toBe(false)
  })

  it.each([
    {
      cachedArrayState: { initialValue: null, rows: [], value: null },
      currentValue: [],
      name: 'null to empty',
    },
    {
      cachedArrayState: { initialValue: 0, rows: [], value: 0 },
      currentValue: null,
      name: 'empty to null',
    },
  ])(
    'should rebuild form state for a $name array transition',
    ({ cachedArrayState, currentValue }) => {
      expect(
        getCachedFormStateIfDataMatches({
          cachedFormState: { items: cachedArrayState },
          formData: { items: currentValue },
        }),
      ).toBe(false)
    },
  )

  it('should ignore blockType and blockName when determining whether cached values match', () => {
    const cachedFormState: FormState = {
      blockName: { initialValue: 'Old block name', value: 'Old block name' },
      id: { initialValue: 'block-1', value: 'block-1' },
      title: { initialValue: 'Gallery', value: 'Gallery' },
    }

    expect(
      getCachedFormStateIfDataMatches({
        cachedFormState,
        formData: {
          blockName: 'Current block name',
          blockType: 'gallery',
          id: 'block-1',
          title: 'Gallery',
        },
      }),
    ).toBe(cachedFormState)
  })
})
