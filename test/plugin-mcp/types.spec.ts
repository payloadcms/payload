// Disable eslint to ensure rules like perfectionist don't run
// if they are accidentally added here
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
  test('static schema — input before handler', () => {
    defineTool({
      description: 'x',
      input: z.object({ id: z.string() }),
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
    })
  })

  test('static schema — handler before input', () => {
    defineTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
      input: z.object({ id: z.string() }),
    })
  })

  test('no schema — input falls back to Record<string, unknown>', () => {
    defineTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<Record<string, unknown>>()
        return { content: [] }
      },
    })
  })
})

describe('defineCollectionTool input inference', () => {
  test('static schema — input before handler', () => {
    defineCollectionTool({
      description: 'x',
      input: z.object({ id: z.string() }),
      handler: ({ input, collectionSlug }) => {
        expect(input).type.toBe<IdSchemaInput>()
        expect(collectionSlug).type.toBe<CollectionSlug>()
        return { content: [] }
      },
    })
  })

  test('static schema — handler before input', () => {
    defineCollectionTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
      input: z.object({ id: z.string() }),
    })
  })

  test('function-form (no param) — handler before input', () => {
    defineCollectionTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
      input: () => z.object({ id: z.string() }),
    })
  })

  test('function-form reading collectionSchema — input before handler (the supported order)', () => {
    defineCollectionTool({
      description: 'x',
      input: ({ collectionSchema }) => {
        // collectionSchema is the per-collection JSON Schema, typed (not implicit any)
        expect(collectionSchema).type.toBeAssignableTo<object>()
        return z.object({ id: z.string() })
      },
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
    })
  })

  test('function-form reading collectionSchema — handler before input', () => {
    defineCollectionTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
      input: ({ collectionSchema }) => {
        expect(collectionSchema).type.toBeAssignableTo<object>()
        return z.object({ id: z.string() })
      },
    })
  })

  test('no schema — input falls back to Record<string, unknown>', () => {
    defineCollectionTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<Record<string, unknown>>()
        return { content: [] }
      },
    })
  })
})

describe('defineGlobalTool input inference', () => {
  test('static schema — input before handler', () => {
    defineGlobalTool({
      description: 'x',
      input: z.object({ id: z.string() }),
      handler: ({ input, globalSlug }) => {
        expect(input).type.toBe<IdSchemaInput>()
        expect(globalSlug).type.toBe<GlobalSlug>()
        return { content: [] }
      },
    })
  })

  test('function-form reading globalSchema — input before handler (the supported order)', () => {
    defineGlobalTool({
      description: 'x',
      input: ({ globalSchema }) => {
        expect(globalSchema).type.toBeAssignableTo<object>()
        return z.object({ id: z.string() })
      },
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
    })
  })

  test('function-form reading globalSchema — handler before input', () => {
    defineGlobalTool({
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { content: [] }
      },
      input: ({ globalSchema }) => {
        expect(globalSchema).type.toBeAssignableTo<object>()
        return z.object({ id: z.string() })
      },
    })
  })
})

describe('definePrompt input inference', () => {
  test('argsSchema before handler', () => {
    definePrompt({
      title: 'x',
      description: 'x',
      argsSchema: z.object({ id: z.string() }),
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { messages: [] }
      },
    })
  })

  test('handler before argsSchema', () => {
    definePrompt({
      title: 'x',
      description: 'x',
      handler: ({ input }) => {
        expect(input).type.toBe<IdSchemaInput>()
        return { messages: [] }
      },
      argsSchema: z.object({ id: z.string() }),
    })
  })
})
