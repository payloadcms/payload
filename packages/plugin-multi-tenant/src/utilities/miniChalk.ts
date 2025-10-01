const codes = {
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  underline: '\x1b[4m',
  white: '\x1b[37m',
  yellow: '\x1b[33m',
}

function colorize(str: string, ...styles: (keyof typeof codes)[]) {
  const start = styles.map((s) => codes[s] || '').join('')
  return `${start}${str}${codes.reset}`
}

export const miniChalk = {
  blue: (str: string) => colorize(str, 'blue'),
  bold: (str: string) => colorize(str, 'bold'),
  cyan: (str: string) => colorize(str, 'cyan'),
  dim: (str: string) => colorize(str, 'dim'),
  green: (str: string) => colorize(str, 'green'),
  magenta: (str: string) => colorize(str, 'magenta'),
  red: (str: string) => colorize(str, 'red'),
  underline: (str: string) => colorize(str, 'underline'),
  white: (str: string) => colorize(str, 'white'),
  yellow: (str: string) => colorize(str, 'yellow'),

  // combos
  redBold: (str: string) => colorize(str, 'red', 'bold'),
  yellowBold: (str: string) => colorize(str, 'yellow', 'bold'),
}
