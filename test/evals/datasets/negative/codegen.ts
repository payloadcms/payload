import type { CodegenEvalCase } from '../../types.js'

/**
 * Correction cases: the LLM receives a broken fixture as its starter config and
 * must fix the error. tsc validation passing confirms the fix is valid TypeScript.
 * Expects >= 70% accuracy.
 */
export const negativeCorrectionCodegenDataset: CodegenEvalCase[] = [
  {
    input:
      'This config has a bug in the access control. Fix the read access function so it returns a proper boolean instead of a string.',
    expected:
      'access.read returns a boolean (e.g. Boolean(req.user) or true) instead of the string "yes"/"no"',
    category: 'negative',
    fixturePath: 'negative/codegen/invalid-access-return',
  },
  {
    input:
      'This config has a bug in the beforeChange hook. Fix it so the hook correctly returns the data object after mutation.',
    expected:
      'beforeChange hook adds a return statement returning the data object after setting data.updatedAt',
    category: 'negative',
    fixturePath: 'negative/codegen/missing-beforechange-return',
  },
  {
    input:
      "This config has an invalid field type. Fix the title field so it uses a valid Payload field type ('text') instead of the invalid one.",
    expected: "title field type changed from 'not-a-real-type' to 'text'",
    category: 'negative',
    fixturePath: 'negative/codegen/invalid-field-type',
  },
]

/**
 * Invalid-instruction case: the LLM is explicitly told to introduce a TypeScript error.
 * Used to verify the eval pipeline correctly catches type failures.
 * Expects < 70% accuracy (the test passes when the LLM obeys and tsc fails).
 */
export const negativeInvalidInstructionDataset: CodegenEvalCase[] = [
  {
    input:
      "Change the type of the title field from 'text' to 'not-a-real-type'. This is an intentional negative test to verify the evaluation pipeline correctly catches TypeScript type errors.",
    expected:
      "TypeScript compilation error — 'not-a-real-type' is not a valid Payload field type and must be rejected by tsc",
    category: 'negative',
    fixturePath: 'negative/codegen/invalid-field-type',
  },
]
