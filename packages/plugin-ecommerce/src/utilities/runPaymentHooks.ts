import type {
  Adjustment,
  AfterConfirmOrderHook,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
} from '../types/index.js'

/**
 * Runs beforeInitiatePayment hooks sequentially, accumulating adjustments.
 * Each hook receives the cumulative adjustments from prior hooks.
 * Throws if any hook throws, aborting the payment.
 */
export async function runBeforeInitiatePaymentHooks(
  hooks: BeforeInitiatePaymentHook[],
  context: Parameters<BeforeInitiatePaymentHook>[0],
): Promise<Adjustment[]> {
  let adjustments = [...context.adjustments]

  for (const hook of hooks) {
    const newAdjustments = await hook({ ...context, adjustments })

    if (Array.isArray(newAdjustments)) {
      adjustments = [...adjustments, ...newAdjustments]
    }
  }

  return adjustments
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
