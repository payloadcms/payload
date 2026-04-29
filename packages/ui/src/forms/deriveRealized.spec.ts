import type { FormState } from 'payload'

import { describe, expect, it } from 'vitest'

import {
  CUSTOM_COMPONENT_KEY_TO_SLOT,
  deriveRealizedFromFormState,
  SLOT_TO_CUSTOM_COMPONENT_KEY,
} from './deriveRealized.js'

describe('deriveRealizedFromFormState', () => {
  it('returns an empty set for null/undefined/empty input', () => {
    expect(deriveRealizedFromFormState(null)).toEqual(new Set())
    expect(deriveRealizedFromFormState(undefined)).toEqual(new Set())
    expect(deriveRealizedFromFormState({})).toEqual(new Set())
  })

  it('emits one entry per populated slot, mapped to lowercase ComponentSlot', () => {
    const formState: FormState = {
      'posts.title': {
        customComponents: {
          AfterInput: 'after',
          BeforeInput: 'before',
          Field: 'field',
        },
      },
      'posts.body': {
        customComponents: {
          Description: 'desc',
          Label: 'label',
        },
      },
    }
    const realized = deriveRealizedFromFormState(formState)
    expect(realized).toEqual(
      new Set([
        'posts.title|afterInput',
        'posts.title|beforeInput',
        'posts.title|Field',
        'posts.body|Description',
        'posts.body|Label',
      ]),
    )
  })

  it('skips fields without `customComponents`', () => {
    const formState: FormState = {
      'posts.title': { value: 'hello' },
      'posts.body': { customComponents: { Field: 'field' } },
    }
    expect(deriveRealizedFromFormState(formState)).toEqual(new Set(['posts.body|Field']))
  })

  it('treats slot key presence as realization, even when the value is nullish', () => {
    // Phase 13.x: deepCopyObjectSimpleWithoutReactComponents (used to strip
    // React elements out of formState before dispatching) replaces every
    // component slot value with `undefined` while leaving the key in place.
    // Realization tracks key presence so decideCall does not re-target rows
    // whose Field slot was just stripped for the dispatch copy.
    const formState: FormState = {
      'posts.title': {
        customComponents: {
          Field: 'field',
          AfterInput: undefined,
          // @ts-expect-error - exercising the runtime guard
          Label: null,
        },
      },
    }
    expect(deriveRealizedFromFormState(formState)).toEqual(
      new Set(['posts.title|Field', 'posts.title|afterInput', 'posts.title|Label']),
    )
  })

  it('SLOT_TO_CUSTOM_COMPONENT_KEY round-trips through CUSTOM_COMPONENT_KEY_TO_SLOT', () => {
    for (const [slot, customKey] of Object.entries(SLOT_TO_CUSTOM_COMPONENT_KEY)) {
      expect(CUSTOM_COMPONENT_KEY_TO_SLOT[customKey]).toBe(slot)
    }
  })
})
