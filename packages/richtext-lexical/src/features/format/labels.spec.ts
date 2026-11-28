import type { GenericLanguages } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'

import type { ToolbarGroup, ToolbarGroupItem } from '../toolbars/types.js'

import { i18n as generalI18n } from '../../i18n.js'
import { BoldFeatureClient } from './bold/feature.client.js'
import { BoldFeature } from './bold/feature.server.js'
import { InlineCodeFeatureClient } from './inlineCode/feature.client.js'
import { InlineCodeFeature } from './inlineCode/feature.server.js'
import { ItalicFeatureClient } from './italic/feature.client.js'
import { ItalicFeature } from './italic/feature.server.js'
import { StrikethroughFeatureClient } from './strikethrough/feature.client.js'
import { StrikethroughFeature } from './strikethrough/feature.server.js'
import { SubscriptFeatureClient } from './subscript/feature.client.js'
import { SubscriptFeature } from './subscript/feature.server.js'
import { SuperscriptFeatureClient } from './superscript/feature.client.js'
import { SuperscriptFeature } from './superscript/feature.server.js'
import { UnderlineFeatureClient } from './underline/feature.client.js'
import { UnderlineFeature } from './underline/feature.server.js'

type Resolvable = (args: Record<string, unknown>) => Record<string, unknown>

const resolve = (feature: unknown): Record<string, unknown> =>
  typeof feature === 'function'
    ? (feature as Resolvable)({ featureProviderMap: new Map(), props: {} })
    : (feature as Record<string, unknown>)

const formats = [
  { client: BoldFeatureClient, english: 'Bold', key: 'bold', server: BoldFeature },
  { client: ItalicFeatureClient, english: 'Italic', key: 'italic', server: ItalicFeature },
  {
    client: UnderlineFeatureClient,
    english: 'Underline',
    key: 'underline',
    server: UnderlineFeature,
  },
  {
    client: StrikethroughFeatureClient,
    english: 'Strikethrough',
    key: 'strikethrough',
    server: StrikethroughFeature,
  },
  {
    client: SubscriptFeatureClient,
    english: 'Subscript',
    key: 'subscript',
    server: SubscriptFeature,
  },
  {
    client: SuperscriptFeatureClient,
    english: 'Superscript',
    key: 'superscript',
    server: SuperscriptFeature,
  },
  {
    client: InlineCodeFeatureClient,
    english: 'Inline Code',
    key: 'inlineCode',
    server: InlineCodeFeature,
  },
]

const languages = Object.keys(generalI18n)

const toolbarItem = (feature: Record<string, unknown>, toolbar: string, key: string) =>
  ((feature[toolbar] as { groups: ToolbarGroup[] } | undefined)?.groups ?? [])
    .flatMap((group) => group.items)
    .find((item: ToolbarGroupItem) => item.key === key)

describe('format feature labels', () => {
  describe.each(formats)('$key', ({ client, english, key, server }) => {
    it('should label its toolbar button through i18n in both toolbars', () => {
      const feature = resolve(client(undefined as never).feature)
      const i18n = { t: (translationKey: string) => translationKey }

      for (const toolbar of ['toolbarFixed', 'toolbarInline']) {
        const label = toolbarItem(feature, toolbar, key)?.label

        expect(typeof label).toBe('function')
        expect((label as (args: { i18n: typeof i18n }) => string)({ i18n })).toBe(
          `lexical:${key}:label`,
        )
      }
    })

    it('should keep the English label the toolbar showed before it was translatable', () => {
      const i18n = resolve(server(undefined as never).feature).i18n as Partial<GenericLanguages>

      expect(i18n?.en?.label).toBe(english)
    })

    it('should provide the label in every language the editor is translated to', () => {
      const i18n = resolve(server(undefined as never).feature).i18n as Partial<GenericLanguages>

      const missing = languages.filter((language) => {
        const label = i18n?.[language as keyof GenericLanguages]?.label
        return typeof label !== 'string' || label.length === 0
      })

      expect(missing).toEqual([])
    })
  })
})
