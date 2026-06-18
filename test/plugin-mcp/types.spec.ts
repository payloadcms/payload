import type { CollectionSlug, GlobalSlug } from 'payload'

import {
  defineCollectionTool,
  defineGlobalTool,
  definePrompt,
  defineTool,
} from '@payloadcms/plugin-mcp'
import { describe, expect, test } from 'tstyche'
import { z } from 'zod'

type IdSchemaInput = { id: string }

describe('defineTool input inference', () => {
  test('static schema', () => {
    defineTool({
      annotations: { readOnlyHint: true },
      description: 'x',
      input: z.object({ id: z.string() }),
    }).handler(({ input }) => {
      expect(input).type.toBe<IdSchemaInput>()
      return { content: [] }
    })
  })

  test('no schema — input falls back to Record<string, unknown>', () => {
    defineTool({
      description: 'x',
    }).handler(({ input }) => {
      expect(input).type.toBe<Record<string, unknown>>()
      return { content: [] }
    })
  })
})

describe('defineCollectionTool input inference', () => {
  test('static schema', () => {
    defineCollectionTool({
      annotations: { destructiveHint: false },
      description: 'x',
      input: z.object({ id: z.string() }),
    }).handler(({ input, collectionSlug }) => {
      expect(input).type.toBe<IdSchemaInput>()
      expect(collectionSlug).type.toBe<CollectionSlug>()
      return { content: [] }
    })
  })

  test('no schema — input falls back to Record<string, unknown>', () => {
    defineCollectionTool({
      description: 'x',
    }).handler(({ input }) => {
      expect(input).type.toBe<Record<string, unknown>>()
      return { content: [] }
    })
  })
})

describe('defineGlobalTool input inference', () => {
  test('static schema', () => {
    defineGlobalTool({
      annotations: { idempotentHint: true },
      description: 'x',
      input: z.object({ id: z.string() }),
    }).handler(({ input, globalSlug }) => {
      expect(input).type.toBe<IdSchemaInput>()
      expect(globalSlug).type.toBe<GlobalSlug>()
      return { content: [] }
    })
  })

})

describe('definePrompt input inference', () => {
  test('static', () => {
    definePrompt({
      title: 'x',
      description: 'x',
      argsSchema: z.object({ id: z.string() }),
    }).handler(({ input }) => {
      expect(input).type.toBe<IdSchemaInput>()
      return { messages: [] }
    })
  })
})
