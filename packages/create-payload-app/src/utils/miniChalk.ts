/**
 * Lightweight chalk replacement using ANSI escape codes.
 * Uses specific SGR close codes (not \x1b[0m) so nested calls
 * preserve outer styles — matching chalk's nesting behavior.
 *
 * Note: This implementation uses specific SGR close codes (e.g. \x1b[39m
 * for fg default) instead of the full reset (\x1b[0m) used by the existing
 * miniChalk utilities in packages/payload and packages/plugin-multi-tenant.
 * This is intentional — full reset breaks nested calls like
 * bold(`${green('text')} more`) by resetting bold when green closes.
 */

const supportsColor =
  !('NO_COLOR' in process.env) &&
  process.env.FORCE_COLOR !== '0' &&
  (process.env.FORCE_COLOR !== undefined || (process.stdout?.isTTY ?? false))

const styles: Record<string, { close: string; open: string }> = {
  // modifiers
  bold: { close: '\x1b[22m', open: '\x1b[1m' },
  dim: { close: '\x1b[22m', open: '\x1b[2m' },
  underline: { close: '\x1b[24m', open: '\x1b[4m' },

  // foreground colors
  black: { close: '\x1b[39m', open: '\x1b[30m' },
  blue: { close: '\x1b[39m', open: '\x1b[34m' },
  cyan: { close: '\x1b[39m', open: '\x1b[36m' },
  gray: { close: '\x1b[39m', open: '\x1b[90m' },
  green: { close: '\x1b[39m', open: '\x1b[32m' },
  magenta: { close: '\x1b[39m', open: '\x1b[35m' },
  red: { close: '\x1b[39m', open: '\x1b[31m' },
  white: { close: '\x1b[39m', open: '\x1b[37m' },
  yellow: { close: '\x1b[39m', open: '\x1b[33m' },

  // background colors
  bgBlack: { close: '\x1b[49m', open: '\x1b[40m' },
  bgCyan: { close: '\x1b[49m', open: '\x1b[46m' },
  bgGray: { close: '\x1b[49m', open: '\x1b[100m' },
  bgGreen: { close: '\x1b[49m', open: '\x1b[42m' },
}

function colorize(str: string, style: keyof typeof styles) {
  if (!supportsColor) return str
  const { close, open } = styles[style]!
  return `${open}${str}${close}`
}

export const miniChalk = {
  bgBlack: (str: string) => colorize(str, 'bgBlack'),
  bgCyan: (str: string) => colorize(str, 'bgCyan'),
  bgGray: (str: string) => colorize(str, 'bgGray'),
  bgGreen: (str: string) => colorize(str, 'bgGreen'),
  black: (str: string) => colorize(str, 'black'),
  blue: (str: string) => colorize(str, 'blue'),
  bold: (str: string) => colorize(str, 'bold'),
  cyan: (str: string) => colorize(str, 'cyan'),
  dim: (str: string) => colorize(str, 'dim'),
  gray: (str: string) => colorize(str, 'gray'),
  green: (str: string) => colorize(str, 'green'),
  magenta: (str: string) => colorize(str, 'magenta'),
  red: (str: string) => colorize(str, 'red'),
  underline: (str: string) => colorize(str, 'underline'),
  white: (str: string) => colorize(str, 'white'),
  yellow: (str: string) => colorize(str, 'yellow'),
}
