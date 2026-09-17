export function ambiguousStrings() {
  const query = 'draft=true'
  const search = new URLSearchParams()
  search.set('draft', 'true')
  return { query, search }
}
