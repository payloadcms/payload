/**
 * Low-power model eval suite.
 *
 * Runs the same datasets as eval.spec.ts but with gpt-4o as the runner model,
 * representing the "open-access" model tier (comparable to open-source models).
 * The scorer stays on gpt-4o-mini (same as the main suite) so scoring is comparable.
 *
 * Usage:
 *   pnpm run test:int evals.low-power     # low-power tier
 *   pnpm run test:int evals               # high-power tier (eval.spec.ts)
 *
 * Cache note: results are keyed by model ID, so the low-power and high-power runs
 * maintain separate caches and do not interfere with each other.
 */
import { assert, beforeAll, describe, it } from 'vitest'

// Datasets
import { collectionsCodegenDataset } from './datasets/collections/codegen.js'
import { collectionsQADataset } from './datasets/collections/qa.js'
import { configCodegenDataset } from './datasets/config/codegen.js'
import { configQADataset } from './datasets/config/qa.js'
import { conventionsQADataset } from './datasets/conventions/qa.js'
import { fieldsCodegenDataset } from './datasets/fields/codegen.js'
import { fieldsQADataset } from './datasets/fields/qa.js'
import {
  negativeCorrectionCodegenDataset,
  negativeInvalidInstructionDataset,
} from './datasets/negative/codegen.js'
import { negativeQADataset } from './datasets/negative/qa.js'
import { pluginsCodegenDataset } from './datasets/plugins/codegen.js'
import { pluginsOfficialCodegenDataset } from './datasets/plugins/official/codegen.js'
import { pluginsOfficialQADataset } from './datasets/plugins/official/qa.js'
import { pluginsQADataset } from './datasets/plugins/qa.js'
import { MODELS } from './models.js'
import { runCodegenDataset } from './runCodegenDataset.js'
import { runDataset } from './runDataset.js'
import { failureMessage } from './utils/index.js'

const PASS_THRESHOLD = 0.7
const LOW_POWER_MODEL = MODELS['openai:gpt-4o']

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
})

describe('Conventions [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(conventionsQADataset, 'Conventions: QA', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Collections [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(collectionsQADataset, 'Collections: QA', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runCodegenDataset(
      collectionsCodegenDataset,
      'Collections: Codegen',
      { runnerModel: LOW_POWER_MODEL },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Fields [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(fieldsQADataset, 'Fields: QA', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runCodegenDataset(fieldsCodegenDataset, 'Fields: Codegen', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Official Plugins [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(
      pluginsOfficialQADataset,
      'Official Plugins: QA',
      { runnerModel: LOW_POWER_MODEL },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runCodegenDataset(
      pluginsOfficialCodegenDataset,
      'Official Plugins: Codegen',
      { runnerModel: LOW_POWER_MODEL },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Building Plugins [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(pluginsQADataset, 'Building Plugins: QA', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runCodegenDataset(
      pluginsCodegenDataset,
      'Building Plugins: Codegen',
      { runnerModel: LOW_POWER_MODEL },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Config [low-power]', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(configQADataset, 'Config: QA', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runCodegenDataset(configCodegenDataset, 'Config: Codegen', {
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Negative Tests [low-power]', () => {
  it('should detect errors in deliberately broken configs', async () => {
    const { accuracy, results } = await runDataset(negativeQADataset, 'Negative: Detection', {
      systemPromptKey: 'configReview',
      runnerModel: LOW_POWER_MODEL,
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it('should fix errors in deliberately broken configs', async () => {
    const { accuracy, results } = await runCodegenDataset(
      negativeCorrectionCodegenDataset,
      'Negative: Correction',
      { runnerModel: LOW_POWER_MODEL },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it('should follow instructions that produce invalid TypeScript', async () => {
    const { accuracy } = await runCodegenDataset(
      negativeInvalidInstructionDataset,
      'Negative: Invalid Instruction',
      { runnerModel: LOW_POWER_MODEL },
    )
    assert(
      accuracy < PASS_THRESHOLD,
      `Expected eval pipeline to catch the deliberately broken config but got ${(accuracy * 100).toFixed(0)}% accuracy — the LLM may have corrected the invalid type instead of following the instruction.`,
    )
  })
})
