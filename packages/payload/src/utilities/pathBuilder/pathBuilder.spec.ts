import { describe, expect, it } from '@jest/globals'

import type {
  ArrayField,
  CollapsibleField,
  GroupField,
  RowField,
  TabsField,
  TextField,
} from '../../fields/config/types.js'

import { getPathBuilder } from './index.js'

describe('PathBuilder', () => {
  describe('Simple field paths', () => {
    it('should build path for a single field', () => {
      const result = getPathBuilder().text('title').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'title',
        schemaPath: 'title',
      })
    })

    it('should build path using specific field type methods', () => {
      const result = getPathBuilder().group('meta').richText('description').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'meta.description',
        schemaPath: 'meta.description',
      })
    })
  })

  describe('Entity context paths', () => {
    it('should build path with collection (no ID) - entityType.entity prefix', () => {
      const result = getPathBuilder({ prefix: 'entityType.entity' })
        .collections('pages')
        .noId()
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'collection.pages.title',
        schemaPath: 'collection.pages.title',
      })
    })

    it('should build path with collection and ID - entityType.entity prefix', () => {
      const result = getPathBuilder({ prefix: 'entityType.entity' })
        .collections('pages')
        .id(123)
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'collection.pages.123.title',
        schemaPath: 'collection.pages.title',
      })
    })

    it('should build path with collection and string ID - entityType.entity prefix', () => {
      const result = getPathBuilder({ prefix: 'entityType.entity' })
        .collections('pages')
        .id('abc123')
        .text('slug')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'collection.pages.abc123.slug',
        schemaPath: 'collection.pages.slug',
      })
    })

    it('should build path with global - entityType.entity prefix', () => {
      const result = getPathBuilder({ prefix: 'entityType.entity' })
        .globals('header')
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'global.header.title',
        schemaPath: 'global.header.title',
      })
    })

    it('should build path with global and nested fields - entityType.entity prefix', () => {
      const result = getPathBuilder({ prefix: 'entityType.entity' })
        .globals('settings')
        .group('site')
        .text('name')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'global.settings.site.name',
        schemaPath: 'global.settings.site.name',
      })
    })

    it('should build path with collection - entity prefix only', () => {
      const result = getPathBuilder({ prefix: 'entity' })
        .collections('pages')
        .id(123)
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'pages.123.title',
        schemaPath: 'pages.title',
      })
    })

    it('should build path with global - entity prefix only', () => {
      const result = getPathBuilder({ prefix: 'entity' }).globals('header').text('title').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'header.title',
        schemaPath: 'header.title',
      })
    })
  })

  describe('Array fields', () => {
    it('should build path for array with index', () => {
      const result = getPathBuilder().array('items').index(0).text('name').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'items.0.name',
        schemaPath: 'items.name',
      })
    })

    it('should build path for array with different index', () => {
      const result = getPathBuilder().array('items').index(5).text('name').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'items.5.name',
        schemaPath: 'items.name',
      })
    })

    it('should build path for array without index (noIndex) and ensure using noIndex does not return a path', () => {
      const result = getPathBuilder().array('items').noIndex().text('name').build()

      expect(result).toEqual({
        indexPath: '',
        path: null,
        schemaPath: 'items.name',
      })
    })

    it('should build path for nested arrays', () => {
      const result = getPathBuilder()
        .array('categories')
        .index(0)
        .array('items')
        .index(2)
        .text('name')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'categories.0.items.2.name',
        schemaPath: 'categories.items.name',
      })
    })

    it('should build path for array field only', () => {
      const result = getPathBuilder().array('items').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'items',
        schemaPath: 'items',
      })
    })
  })

  describe('Blocks fields', () => {
    it('should build path for blocks with block and index', () => {
      const result = getPathBuilder()
        .blocks('content')
        .block('heroBlock')
        .index(0)
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content.0.title',
        schemaPath: 'content.heroBlock.title',
      })
    })

    it('should build path for blocks without index (noIndex)', () => {
      const result = getPathBuilder()
        .blocks('content')
        .block('heroBlock')
        .noIndex()
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: null,
        schemaPath: 'content.heroBlock.title',
      })
    })

    it('should build path for nested blocks', () => {
      const result = getPathBuilder()
        .blocks('layout')
        .block('section')
        .index(0)
        .blocks('content')
        .block('textBlock')
        .index(1)
        .richText('body')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'layout.0.content.1.body',
        schemaPath: 'layout.section.content.textBlock.body',
      })
    })

    it('should build path for blocks field only', () => {
      const result = getPathBuilder().blocks('content').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content',
        schemaPath: 'content',
      })
    })

    it('should build path with block but no further fields', () => {
      const result = getPathBuilder().blocks('content').block('heroBlock').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content',
        schemaPath: 'content.heroBlock',
      })
    })
  })

  describe('Complex nested structures', () => {
    it('should build path for complex nested structure', () => {
      const result = getPathBuilder()
        .blocks('content')
        .block('heroBlock')
        .index(0)
        .group('meta')
        .richText('description')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content.0.meta.description',
        schemaPath: 'content.heroBlock.meta.description',
      })
    })

    it('should build path for array within blocks', () => {
      const result = getPathBuilder()
        .blocks('sections')
        .block('featureList')
        .index(0)
        .array('features')
        .index(2)
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'sections.0.features.2.title',
        schemaPath: 'sections.featureList.features.title',
      })
    })

    it('should build path for blocks within array', () => {
      const result = getPathBuilder()
        .array('columns')
        .index(1)
        .blocks('content')
        .block('textBlock')
        .index(0)
        .richText('text')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'columns.1.content.0.text',
        schemaPath: 'columns.content.textBlock.text',
      })
    })

    it('should handle deeply nested group fields', () => {
      const result = getPathBuilder()
        .group('settings')
        .group('appearance')
        .group('colors')
        .text('primary')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'settings.appearance.colors.primary',
        schemaPath: 'settings.appearance.colors.primary',
      })
    })
  })

  describe('Various field types', () => {
    it('should handle text field', () => {
      const result = getPathBuilder().text('title').build()
      expect(result.path).toBe('title')
    })

    it('should handle textarea field', () => {
      const result = getPathBuilder().textarea('description').build()
      expect(result.path).toBe('description')
    })

    it('should handle number field', () => {
      const result = getPathBuilder().number('count').build()
      expect(result.path).toBe('count')
    })

    it('should handle date field', () => {
      const result = getPathBuilder().date('publishedAt').build()
      expect(result.path).toBe('publishedAt')
    })

    it('should handle checkbox field', () => {
      const result = getPathBuilder().checkbox('isActive').build()
      expect(result.path).toBe('isActive')
    })

    it('should handle select field', () => {
      const result = getPathBuilder().select('status').build()
      expect(result.path).toBe('status')
    })

    it('should handle relationship field', () => {
      const result = getPathBuilder().relationship('author').build()
      expect(result.path).toBe('author')
    })

    it('should handle upload field', () => {
      const result = getPathBuilder().upload('image').build()
      expect(result.path).toBe('image')
    })

    it('should handle point field', () => {
      const result = getPathBuilder().point('location').build()
      expect(result.path).toBe('location')
    })

    it('should handle json field', () => {
      const result = getPathBuilder().json('metadata').build()
      expect(result.path).toBe('metadata')
    })

    it('should handle code field', () => {
      const result = getPathBuilder().code('snippet').build()
      expect(result.path).toBe('snippet')
    })

    it('should handle tabs field with named tab', () => {
      const result = getPathBuilder().tabs().schemaIndex(0).tab('settings').text('apiKey').build()
      expect(result).toEqual({
        indexPath: '',
        path: 'settings.apiKey',
        schemaPath: '_index-0.settings.apiKey',
      })
    })

    it('should handle collapsible field', () => {
      const result = getPathBuilder().collapsible().schemaIndex(0).checkbox('enabled').build()
      expect(result).toEqual({
        indexPath: '',
        path: 'enabled',
        schemaPath: '_index-0.enabled',
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty path', () => {
      const result = getPathBuilder().build()

      expect(result).toEqual({
        indexPath: '',
        path: '',
        schemaPath: '',
      })
    })

    it('should handle multiple noIndex calls', () => {
      const result = getPathBuilder()
        .array('items')
        .noIndex()
        .array('nested')
        .noIndex()
        .text('value')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: null,
        schemaPath: 'items.nested.value',
      })
    })

    it('should handle noSchemaIndex calls', () => {
      const result = getPathBuilder().group().noSchemaIndex().text('value').build()
      expect(result).toEqual({
        indexPath: '',
        path: 'value',
        schemaPath: null,
      })
    })

    it('should handle noIndex followed by index', () => {
      const result = getPathBuilder()
        .array('first')
        .noIndex()
        .array('second')
        .index(3)
        .text('value')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: null,
        schemaPath: 'first.second.value',
      })
    })

    it('should handle schema index path at the end of the path', () => {
      const result = getPathBuilder().group().schemaIndex(0).row().schemaIndex(1).build()
      expect(result).toEqual({
        indexPath: '_index-0-1',
        path: '_index-0-1',
        schemaPath: '_index-0-1',
      })
    })

    it('should handle schema index path at the end of the path, when schemaIndex was discarded before', () => {
      const result = getPathBuilder().group('named').row().schemaIndex(1).build()
      expect(result).toEqual({
        indexPath: '_index-1',
        path: 'named._index-1',
        schemaPath: 'named._index-1',
      })
    })

    it('should handle immutability when branching of the path builder', () => {
      const basePathBuilder = getPathBuilder().group('base')
      const branch1 = basePathBuilder.group('branch1')
      const branch2 = basePathBuilder.group('branch2').text('text')
      const branch3 = basePathBuilder.group('branch3').collapsible().schemaIndex(0).text('text')
      const branch4 = basePathBuilder.group('branch3').collapsible().schemaIndex(2)

      expect(branch1.build()).toEqual({
        indexPath: '',
        path: 'base.branch1',
        schemaPath: 'base.branch1',
      })
      expect(branch2.build()).toEqual({
        indexPath: '',
        path: 'base.branch2.text',
        schemaPath: 'base.branch2.text',
      })
      expect(branch3.build()).toEqual({
        indexPath: '',
        path: 'base.branch3.text',
        schemaPath: 'base.branch3._index-0.text',
      })
      expect(branch4.build()).toEqual({
        indexPath: '_index-2',
        path: 'base.branch3._index-2',
        schemaPath: 'base.branch3._index-2',
      })
      // Build basePath at the end
      expect(basePathBuilder.build()).toEqual({
        indexPath: '',
        path: 'base',
        schemaPath: 'base',
      })
    })
  })

  describe('Field method', () => {
    it('should handle named text field', () => {
      const field: TextField = { type: 'text', name: 'title' }
      const result = getPathBuilder().field(field).build()

      expect(result).toEqual({
        indexPath: '',
        path: 'title',
        schemaPath: 'title',
      })
    })

    it('should handle named array field', () => {
      const field: ArrayField = { type: 'array', name: 'items', fields: [] }
      const result = getPathBuilder().field(field).index(0).text('label').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'items.0.label',
        schemaPath: 'items.label',
      })
    })

    it('should handle named group field', () => {
      const field: GroupField = { type: 'group', name: 'hero', fields: [] }
      const result = getPathBuilder().field(field).text('title').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'hero.title',
        schemaPath: 'hero.title',
      })
    })

    it('should handle unnamed collapsible field', () => {
      const field: CollapsibleField = { type: 'collapsible', fields: [], label: 'Collapsible' }
      const result = getPathBuilder().field(field).schemaIndex(0).text('content').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content',
        schemaPath: '_index-0.content',
      })
    })

    it('should handle unnamed group field', () => {
      const field: GroupField = { type: 'group', fields: [] }
      const result = getPathBuilder().field(field).schemaIndex(1).text('title').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'title',
        schemaPath: '_index-1.title',
      })
    })

    it('should handle unnamed row field', () => {
      const field: RowField = { type: 'row', fields: [] }
      const result = getPathBuilder().field(field).schemaIndex(2).text('label').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'label',
        schemaPath: '_index-2.label',
      })
    })

    it('should handle tabs field', () => {
      const field: TabsField = { type: 'tabs', tabs: [] }
      const result = getPathBuilder()
        .field(field)
        .schemaIndex(0)
        .tab('content')
        .text('body')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content.body',
        schemaPath: '_index-0.content.body',
      })
    })

    it('should chain field() calls', () => {
      const groupField: GroupField = { type: 'group', name: 'hero', fields: [] }
      const textField: TextField = { type: 'text', name: 'title' }
      const result = getPathBuilder().field(groupField).field(textField).build()

      expect(result).toEqual({
        indexPath: '',
        path: 'hero.title',
        schemaPath: 'hero.title',
      })
    })
  })

  describe('Real-world examples', () => {
    it('should match the example from the requirements', () => {
      const result = getPathBuilder()
        .blocks('blocksFieldName')
        .block('content')
        .index(2)
        .richText('description')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'blocksFieldName.2.description',
        schemaPath: 'blocksFieldName.content.description',
      })
    })

    it('should handle e-commerce product with variants', () => {
      const result = getPathBuilder()
        .array('variants')
        .index(0)
        .group('pricing')
        .number('price')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'variants.0.pricing.price',
        schemaPath: 'variants.pricing.price',
      })
    })

    it('should handle blog post with flexible content', () => {
      const result = getPathBuilder()
        .blocks('content')
        .block('imageGallery')
        .index(1)
        .array('images')
        .index(3)
        .upload('image')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content.1.images.3.image',
        schemaPath: 'content.imageGallery.images.image',
      })
    })

    it('should handle form builder', () => {
      const result = getPathBuilder()
        .blocks('fields')
        .block('textField')
        .index(0)
        .text('label')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'fields.0.label',
        schemaPath: 'fields.textField.label',
      })
    })

    it('should handle settings with tabs', () => {
      const result = getPathBuilder()
        .tabs()
        .schemaIndex(0)
        .tab('general')
        .group('site')
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'general.site.title',
        schemaPath: '_index-0.general.site.title',
      })
    })

    it('should handle tabs with numeric index', () => {
      const result = getPathBuilder()
        .group('settings')
        .tabs()
        .schemaIndex(2)
        .tab()
        .schemaIndex(1)
        .text('value')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'settings.value',
        schemaPath: 'settings._index-2-1.value',
      })
    })

    it('should handle unnamed group with schema index', () => {
      const result = getPathBuilder().group().schemaIndex(0).text('title').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'title',
        schemaPath: '_index-0.title',
      })
    })

    it('should handle row field with schema index', () => {
      const result = getPathBuilder().row().schemaIndex(1).text('content').build()

      expect(result).toEqual({
        indexPath: '',
        path: 'content',
        schemaPath: '_index-1.content',
      })
    })

    it('should handle nested unnamed tabs', () => {
      const result = getPathBuilder()
        .tabs()
        .schemaIndex(3)
        .tab()
        .schemaIndex(0)
        .tabs()
        .schemaIndex(1)
        .tab()
        .schemaIndex(0)
        .text('fieldWithinNestedUnnamedTab')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'fieldWithinNestedUnnamedTab',
        schemaPath: '_index-3-0-1-0.fieldWithinNestedUnnamedTab',
      })
    })

    it('should handle named tab within unnamed tabs', () => {
      const result = getPathBuilder()
        .tabs()
        .schemaIndex(3)
        .tab('namedTab')
        .text('fieldWithinNamedTab')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'namedTab.fieldWithinNamedTab',
        schemaPath: '_index-3.namedTab.fieldWithinNamedTab',
      })
    })

    it('should handle row within array', () => {
      const result = getPathBuilder()
        .array('items')
        .index(0)
        .row()
        .schemaIndex(2)
        .text('fieldWithinRowWithinArray')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'items.0.fieldWithinRowWithinArray',
        schemaPath: 'items._index-2.fieldWithinRowWithinArray',
      })
    })

    it('should handle collapsible with nested fields', () => {
      const result = getPathBuilder()
        .collapsible()
        .schemaIndex(1)
        .group('settings')
        .text('value')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'settings.value',
        schemaPath: '_index-1.settings.value',
      })
    })

    it('should handle multiple unnamed groups', () => {
      const result = getPathBuilder()
        .group()
        .schemaIndex(0)
        .group()
        .schemaIndex(1)
        .text('nested')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'nested',
        schemaPath: '_index-0-1.nested',
      })
    })

    it('should handle mix of named and unnamed groups', () => {
      const result = getPathBuilder()
        .group()
        .schemaIndex(0)
        .group('named')
        .group()
        .schemaIndex(2)
        .text('field')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'named.field',
        schemaPath: '_index-0.named._index-2.field',
      })
    })
  })

  describe('Unnamed layout fields without continuation', () => {
    it('should handle .group() without schemaIndex or nested fields - result should match parent', () => {
      const parent = getPathBuilder().group('hero')
      const parentResult = parent.build()

      const child = parent.group()
      const childResult = child.build()

      expect(childResult).toEqual(parentResult)
      expect(childResult).toEqual({
        indexPath: '',
        path: 'hero',
        schemaPath: 'hero',
      })
    })

    it('should handle .row() without schemaIndex or nested fields - result should match parent', () => {
      const parent = getPathBuilder().group('hero')
      const parentResult = parent.build()

      const child = parent.row()
      const childResult = child.build()

      expect(childResult).toEqual(parentResult)
      expect(childResult).toEqual({
        indexPath: '',
        path: 'hero',
        schemaPath: 'hero',
      })
    })

    it('should handle .collapsible() without schemaIndex or nested fields - result should match parent', () => {
      const parent = getPathBuilder().group('hero')
      const parentResult = parent.build()

      const child = parent.collapsible()
      const childResult = child.build()

      expect(childResult).toEqual(parentResult)
      expect(childResult).toEqual({
        indexPath: '',
        path: 'hero',
        schemaPath: 'hero',
      })
    })

    it('should handle .tabs() without schemaIndex or nested fields - result should match parent', () => {
      const parent = getPathBuilder().group('hero')
      const parentResult = parent.build()

      const child = parent.tabs()
      const childResult = child.build()

      expect(childResult).toEqual(parentResult)
      expect(childResult).toEqual({
        indexPath: '',
        path: 'hero',
        schemaPath: 'hero',
      })
    })

    it('should handle nested unnamed fields without continuation - result should match parent', () => {
      const parent = getPathBuilder().group('outer').group('inner')
      const parentResult = parent.build()

      // @ts-expect-error - TypeScript correctly prevents this from being called on a group field.
      // This test ensures the result is expected in case type checking is circumvented, e.g. when using
      // field({type: 'row'} as unknown as Field)
      const child = parent.group().row().collapsible()
      const childResult = child.build()

      expect(childResult).toEqual(parentResult)
      expect(childResult).toEqual({
        indexPath: '',
        path: 'outer.inner',
        schemaPath: 'outer.inner',
      })
    })
  })

  describe('Legacy schema paths', () => {
    it('should omit _index- from schemaPath when not at the end (legacySchemaPaths: true)', () => {
      const result = getPathBuilder({ legacySchemaPaths: true })
        .group()
        .schemaIndex(0)
        .text('field')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'field',
        schemaPath: 'field', // _index-0 is omitted in legacy mode
      })
    })

    it('should include _index- in schemaPath when at the end (legacySchemaPaths: true)', () => {
      const result = getPathBuilder({ legacySchemaPaths: true })
        .group()
        .schemaIndex(0)
        .row()
        .schemaIndex(1)
        .build()

      expect(result).toEqual({
        indexPath: '_index-0-1',
        path: '_index-0-1',
        schemaPath: '_index-0-1', // included because it's at the end
      })
    })

    it('should omit nested _index- from schemaPath when followed by named fields (legacySchemaPaths: true)', () => {
      const result = getPathBuilder({ legacySchemaPaths: true })
        .group()
        .schemaIndex(0)
        .group('named')
        .group()
        .schemaIndex(2)
        .text('field')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'named.field',
        schemaPath: 'named.field', // both _index-0 and _index-2 are omitted
      })
    })

    it('should work with tabs in legacy mode', () => {
      const result = getPathBuilder({ legacySchemaPaths: true })
        .tabs()
        .schemaIndex(0)
        .tab('general')
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'general.title',
        schemaPath: 'general.title', // _index-0 is omitted
      })
    })

    it('should preserve normal behavior when legacySchemaPaths: false', () => {
      const result = getPathBuilder({ legacySchemaPaths: false })
        .group()
        .schemaIndex(0)
        .text('field')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'field',
        schemaPath: '_index-0.field', // _index-0 is included (normal behavior)
      })
    })

    it('should work with entity prefix in legacy mode', () => {
      const result = getPathBuilder({ prefix: 'entity', legacySchemaPaths: true })
        .collections('pages')
        .noId()
        .group()
        .schemaIndex(0)
        .text('title')
        .build()

      expect(result).toEqual({
        indexPath: '',
        path: 'pages.title',
        schemaPath: 'pages.title', // _index-0 is omitted
      })
    })
  })
})
