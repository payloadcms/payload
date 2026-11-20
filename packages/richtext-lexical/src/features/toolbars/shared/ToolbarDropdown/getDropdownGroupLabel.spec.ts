import type { I18nClient } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'

import { i18n as generalI18n } from '../../../../i18n.js'
import { i18n as blocksI18n } from '../../../blocks/server/i18n.js'
import { getDropdownGroupLabel } from './getDropdownGroupLabel.js'

const i18n = { t: (key: string) => key } as unknown as I18nClient

describe('getDropdownGroupLabel', () => {
  it.each([
    ['add', 'lexical:general:insert'],
    ['align', 'lexical:general:alignment'],
    ['blocks', 'lexical:blocks:label'],
    ['inlineBlocks', 'lexical:blocks:inlineBlocks:label'],
    ['text', 'lexical:general:textStyle'],
  ])('should name the built-in %s dropdown through i18n', (groupKey, translationKey) => {
    expect(getDropdownGroupLabel({ groupKey, i18n })).toBe(translationKey)
  })

  it('should leave a custom dropdown group to its own labels', () => {
    expect(getDropdownGroupLabel({ groupKey: 'myCustomGroup', i18n })).toBeUndefined()
  })

  it('should not treat inherited object properties as group names', () => {
    expect(getDropdownGroupLabel({ groupKey: 'constructor', i18n })).toBeUndefined()
  })

  it('should provide the group names in every language the editor is translated to', () => {
    const missing = Object.entries(generalI18n).filter(
      ([, translations]) => !translations?.insert || !translations?.alignment,
    )

    expect(missing.map(([language]) => language)).toEqual([])
  })

  it('should provide the blocks dropdown names in every language the editor is translated to', () => {
    const missing = Object.keys(generalI18n).filter((language) => {
      const translations = blocksI18n[language as keyof typeof blocksI18n] as
        | { inlineBlocks?: { label?: string }; label?: string }
        | undefined

      return !translations?.label || !translations.inlineBlocks?.label
    })

    expect(missing).toEqual([])
  })
})
