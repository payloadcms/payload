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
    yellow: '\x1b[33m'
};
function colorize(str, ...styles) {
    const start = styles.map((s)=>codes[s] || '').join('');
    return `${start}${str}${codes.reset}`;
}
export const miniChalk = {
    blue: (str)=>colorize(str, 'blue'),
    bold: (str)=>colorize(str, 'bold'),
    cyan: (str)=>colorize(str, 'cyan'),
    dim: (str)=>colorize(str, 'dim'),
    green: (str)=>colorize(str, 'green'),
    magenta: (str)=>colorize(str, 'magenta'),
    red: (str)=>colorize(str, 'red'),
    underline: (str)=>colorize(str, 'underline'),
    white: (str)=>colorize(str, 'white'),
    yellow: (str)=>colorize(str, 'yellow'),
    // combos
    redBold: (str)=>colorize(str, 'red', 'bold'),
    yellowBold: (str)=>colorize(str, 'yellow', 'bold')
};

//# sourceMappingURL=miniChalk.js.map