import { JSONSchema4 } from 'json-schema'
import { jsonSchemaToTypescript } from './index.js'
import { describe, expect, it } from 'vitest'
import { format } from 'prettier'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const write = async (source: string) => {
  const formatted = await format(source, { parser: 'typescript', semi: false, singleQuote: true })
  writeFileSync(path.resolve(dirname, 'output.ts'), formatted)
}

const skipWhitespace = (str: string) => str.trim().replace(/\s+/g, '')

describe('jsonSchemaToTypescript', () => {
  it('should convert a simple JSON schema to TypeScript interface', async () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    }

    const result = jsonSchemaToTypescript(schema)

    await write(result)

    const expected = `interface Root {
  name: string;
  age: number;
}`

    expect(skipWhitespace(result)).toBe(skipWhitespace(expected))
  })

  it('should handle optional properties', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    }

    const result = jsonSchemaToTypescript(schema)

    const expected = `interface Root {
  name: string;
  age?: number;
}`

    expect(skipWhitespace(result)).toBe(skipWhitespace(expected))
  })

  it('should handle nested objects', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name'],
        },
      },
      required: ['person'],
    }

    const result = jsonSchemaToTypescript(schema)

    const expected = `interface Root {
  person: {
    name: string;
    age?: number;
  };
}`

    expect(skipWhitespace(result)).toBe(skipWhitespace(expected))
  })
})
