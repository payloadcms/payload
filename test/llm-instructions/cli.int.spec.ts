import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
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
  ]) {
    test(`should include configured instructions for hidden ${slug}`, async ({ cli }) => {
      const output = await cli(`${command} --slug ${slug} --json`)
      const response = JSON.parse(output.stdout)

      expect(response).toMatchObject({
        result: { slug, schema: expect.any(Object) },
        success: true,
      })
      expect(response.result.instructions).toBe(instructions)
    })
  }

  test('should include configured collection instructions alongside the CLI JSON schema', async ({
    cli,
  }) => {
    const output = await cli('getCollectionSchema --slug pages --json')
    const response = JSON.parse(output.stdout)

    expect(response).toMatchObject({
      result: { slug: 'pages', schema: expect.any(Object) },
      success: true,
    })
    expect(response.result.instructions).toContain('Use the configured layout blocks.')
    expect(response).not.toHaveProperty('instructions')
  })

  test('should include instructions in the normal CLI schema output', async ({ cli }) => {
    const output = await cli('getCollectionSchema --slug pages --no-json')

    expect(output.stdout).toContain('"schema":')
    expect(output.stdout).toContain('"instructions":')
    expect(output.stdout).toContain('Use the configured layout blocks.')
  })

  for (const command of [
    'countDocuments --slug pages',
    'findGlobal --slug site-settings',
    `createDocuments --slug pages --documents '[{"data":{"title":"New page"}}]'`,
    `updateGlobal --slug site-settings --data '{"title":"New site title"}'`,
  ]) {
    test(`should omit instructions from ${command.split(' ')[0]} responses`, async ({ cli }) => {
      const output = await cli(`${command} --json`)
      const response = JSON.parse(output.stdout)

      expect(response.success).toBe(true)
      expect(response).not.toHaveProperty('instructions')
      expect(response.result).not.toHaveProperty('instructions')
      expect(output.stdout).not.toContain('Use the configured layout blocks.')
    })
  }

  test('should omit CLI instructions when none are configured', async ({ cli }) => {
    const output = await cli('getGlobalSchema --slug site-settings --json')
    const response = JSON.parse(output.stdout)

    expect(response).toMatchObject({ result: { slug: 'site-settings' }, success: true })
    expect(response).not.toHaveProperty('instructions')
    expect(response.result).not.toHaveProperty('instructions')
  })
})
