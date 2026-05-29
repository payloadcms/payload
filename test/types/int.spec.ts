import type { SanitizedConfig } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { configToJSONSchema, getPayload } from 'payload'
import { fileURLToPath } from 'url'
import { beforeAll, describe, expect, it } from 'vitest'

import config from './config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let sanitizedConfig: SanitizedConfig

beforeAll(async () => {
  // Initialize Payload to get the sanitized config
  const payload = await getPayload({ config, cron: false })
  sanitizedConfig = payload.config
})

describe('typescript.postProcess', () => {
  it('should apply postProcess functions to generated types', async () => {
    const outputFile = path.resolve(dirname, 'payload-types.ts')
    const content = await fs.readFile(outputFile, 'utf-8')

    // Verify custom types were injected by postProcess
    expect(content).toContain('export type TestPluginGeneric<T> = { value: T };')
    expect(content).toContain('export type SecondGeneric<K, V> = { key: K; value: V };')
  })

  it('should apply multiple postProcess functions in order', async () => {
    const outputFile = path.resolve(dirname, 'payload-types.ts')
    const content = await fs.readFile(outputFile, 'utf-8')

    // SecondGeneric (from second function) should appear before TestPluginGeneric
    // because the second function prepends to TestPluginGeneric
    const secondIndex = content.indexOf('SecondGeneric')
    const firstIndex = content.indexOf('TestPluginGeneric')
    const configIndex = content.indexOf('export interface Config')

    expect(secondIndex).toBeGreaterThan(-1)
    expect(firstIndex).toBeGreaterThan(-1)
    expect(secondIndex).toBeLessThan(firstIndex)
    expect(firstIndex).toBeLessThan(configIndex)
  })

  describe('Issue #16797 - typescriptSchema with admin.condition', () => {
    it('should include requiredWithAdminCondition in the required array of the generated JSON schema', () => {
      // Generate schema directly from the sanitized config - this tests the actual fix
      const schema = configToJSONSchema(sanitizedConfig, 'text')

      expect(schema.definitions).toBeDefined()
      expect(schema.definitions?.posts).toBeDefined()

      const postsSchema = schema.definitions!.posts as any

      // Before fix: requiredWithAdminCondition would NOT be in this array
      // After fix: it SHOULD be in this array
      expect(postsSchema.required).toContain('requiredWithAdminCondition')
    })

    it('should mark requiredWithAdminCondition as required even with admin.condition present', () => {
      const schema = configToJSONSchema(sanitizedConfig, 'text')

      const postsSchema = schema.definitions!.posts as any

      // Verify the field exists in properties
      expect(postsSchema.properties.requiredWithAdminCondition).toBeDefined()

      // Verify it's in the required array
      expect(postsSchema.required.includes('requiredWithAdminCondition')).toBe(true)

      // Verify the type is correct
      const fieldSchema = postsSchema.properties.requiredWithAdminCondition
      expect(fieldSchema.type).toBe('number')
    })

    it('should verify that admin.condition did not cause other required fields to become optional', () => {
      const schema = configToJSONSchema(sanitizedConfig, 'text')

      const postsSchema = schema.definitions!.posts as any
      const requiredFields = postsSchema.required

      // Verify all required fields are in the required array
      expect(requiredFields).toContain('requiredWithAdminCondition')
      expect(requiredFields).toContain('richText')
      expect(requiredFields).toContain('selectField')
      expect(requiredFields).toContain('radioField')
    })
  })
})
