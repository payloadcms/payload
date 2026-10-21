/** Internal native-compiler boundary; no request can opt SQL out of this check. */
export const isBranchReadSQL = ({ sql }: { sql: string }): boolean => {
  // Quoted literals/identifiers and comments are whole tokens. Keywords inside
  // them cannot turn a SELECT into a write and must not reject real field names.
  const tokens: string[] =
    sql.match(
      /'(?:''|[^'])*'|"(?:""|[^"])*"|`(?:``|[^`])*`|\[[^\]]*\]|--[^\r\n]*|\/\*[\s\S]*?\*\/|[a-z_][\w$]*|;/gi,
    ) ?? []
  const keywords = tokens
    .filter((token) => /^[a-z_]/i.test(token))
    .map((token) => token.toLowerCase())

  if (!['select', 'with'].includes(keywords[0] ?? '') || tokens.includes(';')) {
    return false
  }

  // In SQLite a CTE body is a SELECT. Refuse every mutating outer statement as
  // well as transaction/pragma commands, even if passed through .all() or .raw().
  const writes = new Set([
    'alter',
    'analyze',
    'attach',
    'begin',
    'commit',
    'create',
    'delete',
    'detach',
    'drop',
    'insert',
    'load_extension',
    'pragma',
    'reindex',
    'release',
    'replace',
    'rollback',
    'savepoint',
    'update',
    'vacuum',
    'writefile',
  ])

  return !keywords.some((keyword) => writes.has(keyword))
}
