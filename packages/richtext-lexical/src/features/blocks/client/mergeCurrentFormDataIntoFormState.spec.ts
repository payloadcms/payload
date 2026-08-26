import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { mergeCurrentFormDataIntoFormState } from './mergeCurrentFormDataIntoFormState.js'

describe('mergeCurrentFormDataIntoFormState', () => {
  it('should preserve user-added array rows when rebuilding cached block form state', () => {
    const cachedFormState: FormState = {
      images: {
        disableFormData: true,
        errorPaths: ['images.0.image'],
        initialValue: 1,
        rows: [{ collapsed: true, id: 'row-1', isLoading: false }],
        value: 1,
      },
      'images.0.id': {
        initialValue: 'row-1',
        passesCondition: true,
        valid: true,
        value: 'row-1',
      },
      'images.0.image': {
        initialValue: 'original-image',
        passesCondition: true,
        valid: true,
        value: 'original-image',
      },
      'images.2.image': {
        initialValue: 'stale-image',
        passesCondition: true,
        valid: true,
        value: 'stale-image',
      },
    }

    const result = mergeCurrentFormDataIntoFormState({
      cachedFormState,
      formData: {
        images: [
          { id: 'row-1', image: 'updated-image' },
          { id: 'row-2', image: 'new-image' },
        ],
      },
    })

    expect(result.images).toMatchObject({
      disableFormData: true,
      errorPaths: ['images.0.image'],
      initialValue: 2,
      rows: [
        { collapsed: true, id: 'row-1', isLoading: false },
        { id: 'row-2', isLoading: false },
      ],
      value: 2,
    })
    expect(result['images.0.image']).toMatchObject({
      initialValue: 'updated-image',
      passesCondition: true,
      valid: true,
      value: 'updated-image',
    })
    expect(result['images.1.image']).toMatchObject({
      initialValue: 'new-image',
      passesCondition: true,
      valid: true,
      value: 'new-image',
    })
    expect(result['images.1.id']).toMatchObject({
      initialValue: 'row-2',
      value: 'row-2',
    })
    expect(result['images.2.image']).toBeUndefined()
  })

  it('should rebuild nested array leaves inside groups and block rows', () => {
    const cachedFormState: FormState = {
      content: {
        disableFormData: true,
        initialValue: 1,
        rows: [{ blockType: 'gallery', id: 'block-1' }],
        value: 1,
      },
      'content.0.blockType': { initialValue: 'gallery', value: 'gallery' },
      'content.0.id': { initialValue: 'block-1', value: 'block-1' },
      'content.0.settings': { disableFormData: true },
      'content.0.settings.images': {
        disableFormData: true,
        initialValue: 1,
        rows: [{ id: 'image-1' }],
        value: 1,
      },
      'content.0.settings.images.0.id': { initialValue: 'image-1', value: 'image-1' },
      'content.0.settings.images.0.alt': {
        initialValue: 'old alt',
        passesCondition: true,
        valid: true,
        value: 'old alt',
      },
    }

    const result = mergeCurrentFormDataIntoFormState({
      cachedFormState,
      formData: {
        content: [
          {
            blockType: 'gallery',
            id: 'block-1',
            settings: {
              images: [
                { alt: 'updated alt', id: 'image-1' },
                { alt: 'new nested alt', id: 'image-2' },
              ],
            },
          },
        ],
      },
    })

    expect(result.content).toMatchObject({
      initialValue: 1,
      rows: [{ blockType: 'gallery', id: 'block-1' }],
      value: 1,
    })
    expect(result['content.0.settings']).toStrictEqual({ disableFormData: true })
    expect(result['content.0.settings.images']).toMatchObject({
      initialValue: 2,
      rows: [{ id: 'image-1' }, { id: 'image-2', isLoading: false }],
      value: 2,
    })
    expect(result['content.0.settings.images.0.alt']?.value).toBe('updated alt')
    expect(result['content.0.settings.images.1.alt']?.value).toBe('new nested alt')
  })

  it('should keep scalar and object-valued field behavior unchanged', () => {
    const cachedFormState: FormState = {
      relationship: {
        initialValue: { id: 'old-id', title: 'Old title' },
        passesCondition: true,
        valid: true,
        value: { id: 'old-id', title: 'Old title' },
      },
      title: {
        initialValue: 'Old title',
        passesCondition: true,
        valid: true,
        value: 'Old title',
      },
    }
    const relationship = { id: 'new-id', title: 'New title' }

    const result = mergeCurrentFormDataIntoFormState({
      cachedFormState,
      formData: { relationship, title: 'New title' },
    })

    expect(result.relationship).toStrictEqual({
      initialValue: relationship,
      passesCondition: true,
      valid: true,
      value: relationship,
    })
    expect(result.title).toStrictEqual({
      initialValue: 'New title',
      passesCondition: true,
      valid: true,
      value: 'New title',
    })
  })
})
