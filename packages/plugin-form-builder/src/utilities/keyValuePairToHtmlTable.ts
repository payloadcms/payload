import escapeHTML from 'escape-html'

export function keyValuePairToHtmlTable(obj: { [key: string]: string }): string {
  let htmlTable = '<table>'

  for (const [key, value] of Object.entries(obj)) {
    htmlTable += `<tr><td>${escapeHTML(key)}</td><td>${escapeHTML(value)}</td></tr>`
  }

  htmlTable += '</table>'
  return htmlTable
}
