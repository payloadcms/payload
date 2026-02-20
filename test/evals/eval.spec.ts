import { assert, beforeAll, describe, it } from 'vitest'

import { collectionsCodegenDataset } from './datasets/collections.codegen.js'
import { collectionsQADataset } from './datasets/collections.qa.js'
import { configCodegenDataset } from './datasets/config.codegen.js'
import { configQADataset } from './datasets/config.qa.js'
import { failureMessage, runDataset } from './runDataset.js'
// Datasets
import { conventionsQADataset } from './datasets/conventions.qa.js'
import { fieldsCodegenDataset } from './datasets/fields.codegen.js'
import { fieldsQADataset } from './datasets/fields.qa.js'

const PASS_THRESHOLD = 0.7

beforeAll(() => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY must be set to run eval tests')
  }
})

describe('Conventions', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(conventionsQADataset, 'Conventions: QA')
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Collections', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(collectionsQADataset, 'Collections: QA')
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runDataset(
      collectionsCodegenDataset,
      'Collections: Codegen',
      {
        systemPromptKey: 'codegen',
      },
    )
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Fields', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(fieldsQADataset, 'Fields: QA')
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runDataset(fieldsCodegenDataset, 'Fields: Codegen', {
      systemPromptKey: 'codegen',
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})

describe('Config', () => {
  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on question answering`, async () => {
    const { accuracy, results } = await runDataset(configQADataset, 'Config: QA')
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })

  it(`should achieve >= ${PASS_THRESHOLD * 100}% accuracy on code generation`, async () => {
    const { accuracy, results } = await runDataset(configCodegenDataset, 'Config: Codegen', {
      systemPromptKey: 'codegen',
    })
    const failed = results.filter((r) => !r.pass)
    assert(accuracy >= PASS_THRESHOLD, failureMessage(accuracy, failed))
  })
})
