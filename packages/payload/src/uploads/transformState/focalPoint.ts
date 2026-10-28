/**
 * A focal point only guides later crops; it does not change the file. So it has two rules that
 * other keys do not:
 * - it may be saved with no stage that claims it
 * - changing only the focal point rebuilds the file only when a stage that runs claims it
 *
 * Two claims are still an error.
 */
export const isFocalPointKey = (key: string): boolean => key === 'focalPoint'
