const formulaStartPattern = /^(?:\s*[=+\-@＝＋－＠]|[\t\r\n])/u

// Cast only strings so negative numeric values keep their CSV representation.
export const escapeCSVFormulaString = (value: string): string =>
  formulaStartPattern.test(value) ? `'${value}` : value
