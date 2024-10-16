export function keyValuePairToHtmlTable(obj: { [key: string]: string }): string {
  let htmlTable = '<table>'

  for (const [key, value] of Object.entries(obj)) {
    htmlTable += `<tr><td>${key}</td><td>${value}</td></tr>`
  }

  htmlTable += '</table>'
  return htmlTable
}
