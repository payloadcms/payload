import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import { reduceFieldsToValues } from '../../../../payload/src/utilities/reduceFieldsToValues.js'
import { mergeServerFormState } from './mergeServerFormState.js'

describe('mergeServerFormState', () => {
  const currentState: FormState = {
    items: {
      disableFormData: true,
      initialValue: 2,
      rows: [{ id: 'A' }, { id: 'B' }],
      value: 2,
    },
    'items.0.id': { initialValue: 'A', value: 'A' },
    'items.0.text': { initialValue: 'Remove me', value: 'Remove me' },
    'items.1.id': { initialValue: 'B', value: 'B' },
    'items.1.text': { initialValue: 'Keep me', value: 'Keep me' },
  }
  const incomingState: FormState = {
    items: {
      disableFormData: true,
      initialValue: 1,
      rows: [{ id: 'B' }],
      value: 1,
    },
    'items.0.id': { initialValue: 'B', value: 'B' },
    'items.0.text': { initialValue: 'Keep me', value: 'Keep me' },
  }

  it('should serialize only authoritative rows after the server removes a row', () => {
    const originalCurrentState = structuredClone(currentState)
    const originalIncomingState = structuredClone(incomingState)
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState,
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({
      items: [{ id: 'B', text: 'Keep me' }],
    })
    expect(newState['items.1.id']).toBeUndefined()
    expect(newState['items.1.text']).toBeUndefined()
    expect(currentState).toStrictEqual(originalCurrentState)
    expect(incomingState).toStrictEqual(originalIncomingState)
  })

  it('should serialize the empty-array marker after the server removes all rows', () => {
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState,
      incomingState: {
        items: { initialValue: 0, rows: [], value: 0 },
      },
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({ items: 0 })
    expect(Object.keys(newState)).toStrictEqual(['items'])
  })

  it('should remove stale row fields from nested arrays', () => {
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState: {
        groups: { disableFormData: true, rows: [{ id: 'group' }], value: 1 },
        'groups.0.id': { value: 'group' },
        'groups.0.items': {
          disableFormData: true,
          rows: [{ id: 'A' }, { id: 'B' }],
          value: 2,
        },
        'groups.0.items.0.id': { value: 'A' },
        'groups.0.items.0.text': { value: 'Remove me' },
        'groups.0.items.1.id': { value: 'B' },
        'groups.0.items.1.text': { value: 'Keep me' },
      },
      incomingState: {
        groups: { disableFormData: true, rows: [{ id: 'group' }], value: 1 },
        'groups.0.id': { value: 'group' },
        'groups.0.items': { disableFormData: true, rows: [{ id: 'B' }], value: 1 },
        'groups.0.items.0.id': { value: 'B' },
        'groups.0.items.0.text': { value: 'Keep me' },
      },
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({
      groups: [{ id: 'group', items: [{ id: 'B', text: 'Keep me' }] }],
    })
    expect(newState['groups.0.items.1.text']).toBeUndefined()
  })

  it('should remove nested arrays belonging to a removed outer row', () => {
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState: {
        groups: { disableFormData: true, rows: [{ id: 'A' }, { id: 'B' }], value: 2 },
        'groups.0.id': { value: 'A' },
        'groups.0.items': { disableFormData: true, rows: [{ id: 'item-A' }], value: 1 },
        'groups.0.items.0.id': { value: 'item-A' },
        'groups.1.id': { value: 'B' },
        'groups.1.items': { disableFormData: true, rows: [{ id: 'item-B' }], value: 1 },
        'groups.1.items.0.id': { value: 'item-B' },
      },
      incomingState: {
        groups: { disableFormData: true, rows: [{ id: 'A' }], value: 1 },
        'groups.0.id': { value: 'A' },
        'groups.0.items': { disableFormData: true, rows: [{ id: 'item-A' }], value: 1 },
        'groups.0.items.0.id': { value: 'item-A' },
      },
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({
      groups: [{ id: 'A', items: [{ id: 'item-A' }] }],
    })
    expect(newState['groups.1.items']).toBeUndefined()
    expect(newState['groups.1.items.0.id']).toBeUndefined()
  })

  it('should remove fields belonging to a block replaced at the same index', () => {
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState: {
        blocks: {
          disableFormData: true,
          rows: [{ id: 'text-block', blockType: 'text' }],
          value: 1,
        },
        'blocks.0.blockType': { value: 'text' },
        'blocks.0.id': { value: 'text-block' },
        'blocks.0.text': { value: 'Old text' },
      },
      incomingState: {
        blocks: {
          disableFormData: true,
          rows: [{ id: 'image-block', blockType: 'image' }],
          value: 1,
        },
        'blocks.0.blockType': { value: 'image' },
        'blocks.0.id': { value: 'image-block' },
        'blocks.0.image': { addedByServer: true, value: 'image-id' },
      },
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({
      blocks: [{ id: 'image-block', blockType: 'image', image: 'image-id' }],
    })
    expect(newState['blocks.0.text']).toBeUndefined()
  })

  it('should preserve metadata and local-only fields for retained rows', () => {
    const newState = mergeServerFormState({
      acceptValues: true,
      currentState: {
        items: {
          disableFormData: true,
          rows: [{ id: 'A', collapsed: true, customComponents: { RowLabel: 'Row label' } }],
          value: 1,
        },
        'items.0.id': { value: 'A' },
        'items.0.text': { customComponents: { Field: 'Custom field' }, value: 'Local text' },
        'items.0.localUI': { disableFormData: true, value: 'Local UI state' },
        itemsExtra: { value: 'Sibling value' },
        'other.0.text': { value: 'Other row' },
      },
      incomingState: {
        items: { disableFormData: true, rows: [{ id: 'A' }], value: 1 },
        'items.0.id': { value: 'A' },
        'items.0.text': { value: 'Server text' },
      },
    })

    expect(reduceFieldsToValues(newState, true)).toStrictEqual({
      items: [{ id: 'A', text: 'Server text' }],
      itemsExtra: 'Sibling value',
      other: [{ text: 'Other row' }],
    })
    expect(newState.items.rows).toStrictEqual([
      { id: 'A', collapsed: true, customComponents: { RowLabel: 'Row label' } },
    ])
    expect(newState['items.0.text'].customComponents).toStrictEqual({ Field: 'Custom field' })
    expect(newState['items.0.localUI']).toStrictEqual({
      disableFormData: true,
      value: 'Local UI state',
    })
  })

  it.each([undefined, false, { overrideLocalChanges: false }])(
    'should retain client row membership for a nonauthoritative response (%j)',
    (acceptValues) => {
      const newState = mergeServerFormState({ acceptValues, currentState, incomingState })

      expect(reduceFieldsToValues(newState, true)).toStrictEqual({
        items: [
          { id: 'A', text: 'Remove me' },
          { id: 'B', text: 'Keep me' },
        ],
      })
      expect(newState.items.rows).toStrictEqual([{ id: 'A' }, { id: 'B' }])
    },
  )
})
