import { instructionsCollectionSlug } from 'payload/shared'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { saveAdditionalInstructions } from './helpers.js'
import { hiddenCollectionSlug, hiddenGlobalSlug } from './slugs.js'

test.suite('CLI LLM instructions', { config: './config.ts' }, () => {
  for (const { command, slug, instructions } of [
    {
      command: 'getCollectionSchema',
      slug: hiddenCollectionSlug,
      instructions: 'Keep hidden pages private.',
    },
    {
      command: 'getGlobalSchema',
      slug: hiddenGlobalSlug,
      instructions: 'Preserve hidden settings.',
    },
    { command: 'getCollectionSchema', slug: instructionsCollectionSlug, instructions: undefined },
  ] as const) {
    test(`should return the schema for non-target ${slug}`, async ({ cli }) => {
      const output = await cli(`${command} --slug ${slug} --json`)
      const response = JSON.parse(output.stdout)

      expect(response).toMatchObject({
        result: { slug, schema: expect.any(Object) },
        success: true,
      })
      expect(response.result.instructions).toBe(instructions)
    })
  }

  test('should include saved global instructions alongside the CLI schema', async ({
    cli,
    payload,
  }) => {
    await saveAdditionalInstructions({ entitySlug: 'site-settings', entityType: 'global', payload })

    const output = await cli('getGlobalSchema --slug site-settings --json')
    const response = JSON.parse(output.stdout)

    expect(response).toMatchObject({
      result: {
        slug: 'site-settings',
        instructions: 'Keep page summaries under 100 words.',
        schema: expect.any(Object),
      },
      success: true,
    })
    expect(response).not.toHaveProperty('instructions')
  })

  test('should include configured and saved collection instructions alongside the CLI JSON schema', async ({
    cli,
    payload,
  }) => {
    await saveAdditionalInstructions({ entitySlug: 'pages', entityType: 'collection', payload })

    const output = await cli('getCollectionSchema --slug pages --json')
    const response = JSON.parse(output.stdout)

    expect(response).toMatchObject({
      result: { slug: 'pages', schema: expect.any(Object) },
      success: true,
    })
    expect(response.result.instructions).toContain('Use the configured layout blocks.')
    expect(response.result.instructions).toContain('Keep page summaries under 100 words.')
    expect(response).not.toHaveProperty('instructions')
  })

  test('should include instructions in the normal CLI schema output', async ({ cli, payload }) => {
    await saveAdditionalInstructions({ entitySlug: 'pages', entityType: 'collection', payload })

    const output = await cli('getCollectionSchema --slug pages --no-json')

    expect(output.stdout).toContain('"schema":')
    expect(output.stdout).toContain('"instructions":')
    expect(output.stdout).toContain('Use the configured layout blocks.')
    expect(output.stdout).toContain('Keep page summaries under 100 words.')
  })

  for (const { command, target } of [
    {
      command: 'countDocuments --slug pages',
      target: { entitySlug: 'pages', entityType: 'collection' },
    },
    {
      command: 'findGlobal --slug site-settings',
      target: { entitySlug: 'site-settings', entityType: 'global' },
    },
    {
      command: `createDocuments --slug pages --documents '[{"data":{"title":"New page"}}]'`,
      target: { entitySlug: 'pages', entityType: 'collection' },
    },
    {
      command: `updateGlobal --slug site-settings --data '{"title":"New site title"}'`,
      target: { entitySlug: 'site-settings', entityType: 'global' },
    },
  ] as const) {
    test(`should omit instructions from ${command.split(' ')[0]} responses`, async ({
      cli,
      payload,
    }) => {
      await saveAdditionalInstructions({ ...target, payload })

      const output = await cli(`${command} --json`)
      const response = JSON.parse(output.stdout)

      expect(response.success).toBe(true)
      expect(response).not.toHaveProperty('instructions')
      expect(response.result).not.toHaveProperty('instructions')
      expect(output.stdout).not.toContain('Use the configured layout blocks.')
      expect(output.stdout).not.toContain('Keep page summaries under 100 words.')
    })
  }

  test('should omit CLI instructions when none are configured or saved', async ({ cli }) => {
    const output = await cli('getGlobalSchema --slug site-settings --json')
    const response = JSON.parse(output.stdout)

    expect(response).toMatchObject({ result: { slug: 'site-settings' }, success: true })
    expect(response).not.toHaveProperty('instructions')
    expect(response.result).not.toHaveProperty('instructions')
  })
})
