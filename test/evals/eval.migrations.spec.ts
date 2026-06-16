import { describe } from 'vitest'

import { migrationsCodegenDataset } from './datasets/migrations/codegen.js'
import { registerCodegenCases } from './suites/helpers.js'
import { resolveVariantOptions } from './variantOptions.js'

const options = resolveVariantOptions()
const { labelSuffix = '' } = options

describe(`Migrations${labelSuffix}`, () => {
  registerCodegenCases(migrationsCodegenDataset, 'Migrations: Codegen', options)
})
