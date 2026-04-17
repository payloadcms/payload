import type {
  AfterConfirmOrderHook,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
  Summary,
} from '../types/index.js'

const recomputeTotal = (summary: Summary): Summary => ({
  ...summary,
  total: summary.lines.reduce((sum, line) => sum + line.amount, 0),
})

const assertSummaryInvariants = (
  summary: Summary,
  expected: { currency: string; subtotal: number },
  hookIndex: number,
): void => {
  if (!summary || !Array.isArray(summary.lines)) {
    throw new Error(
      `beforeInitiatePayment hook ${hookIndex} returned an invalid summary (missing lines).`,
    )
  }

  const subtotalLine = summary.lines[0]

  if (!subtotalLine || subtotalLine.type !== 'subtotal') {
    throw new Error(
      `beforeInitiatePayment hook ${hookIndex} removed or reordered the subtotal line. lines[0] must always be the cart subtotal.`,
    )
  }

  if (subtotalLine.amount !== expected.subtotal) {
    throw new Error(
      `beforeInitiatePayment hook ${hookIndex} changed the subtotal amount from ${expected.subtotal} to ${subtotalLine.amount}. Subtotal is managed by the plugin and must not be mutated.`,
    )
  }

  if (summary.currency !== expected.currency) {
    throw new Error(
      `beforeInitiatePayment hook ${hookIndex} changed summary.currency — currency must remain "${expected.currency}".`,
    )
  }
}

/**
 * Runs beforeInitiatePayment hooks sequentially, piping the Summary through each.
 *
 * After every hook, the plugin:
 * 1. Recomputes `total` from `sum(lines[].amount)` — any total the hook sets is ignored.
 * 2. Validates `lines[0]` is still the subtotal line with the original cart subtotal.
 * 3. Validates `currency` has not changed.
 *
 * Throws (aborting the payment) if a hook throws or breaks an invariant.
 */
export async function runBeforeInitiatePaymentHooks(
  hooks: BeforeInitiatePaymentHook[],
  context: { summary: Summary } & Omit<Parameters<BeforeInitiatePaymentHook>[0], 'summary'>,
): Promise<Summary> {
  let summary: Summary = recomputeTotal(context.summary)

  const expected = {
    currency: summary.currency,
    subtotal: summary.lines[0]?.amount ?? 0,
  }

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i]!
    const next = await hook({ ...context, summary })

    assertSummaryInvariants(next, expected, i)
    summary = recomputeTotal(next)
  }

  return summary
}

/**
 * Runs beforeConfirmOrder hooks sequentially.
 * Throws if any hook throws, aborting the confirmation.
 */
export async function runBeforeConfirmOrderHooks(
  hooks: BeforeConfirmOrderHook[],
  context: Parameters<BeforeConfirmOrderHook>[0],
): Promise<void> {
  for (const hook of hooks) {
    await hook(context)
  }
}

/**
 * Runs afterConfirmOrder hooks sequentially.
 * Errors are caught and logged but do not fail the response.
 * All hooks execute even if some fail.
 */
export async function runAfterConfirmOrderHooks(
  hooks: AfterConfirmOrderHook[],
  context: Parameters<AfterConfirmOrderHook>[0],
  logger: { error: (...args: unknown[]) => void },
): Promise<void> {
  for (const hook of hooks) {
    try {
      await hook(context)
    } catch (error) {
      logger.error(error, 'Error in afterConfirmOrder hook.')
    }
  }
}
