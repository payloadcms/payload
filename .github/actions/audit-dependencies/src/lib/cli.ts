import type { Scope, Severity } from '../types'

export const SCOPES: readonly Scope[] = ['consumer-facing', 'monorepo']

export const SEVERITIES: readonly Severity[] = ['low', 'moderate', 'high', 'critical']

export type CliOptions = {
  jsonPath: string
  scope: Scope
  severity: Severity
}

export type ParseResult = { error: string; ok: false } | { ok: true; options: CliOptions }

/**
 * Resolves options from CLI flags (`--scope=...`) first, then the composite
 * action's `INPUT_*` env vars, then defaults. Invalid scope/severity is a hard
 * input error (exit 2 at the call site).
 */
export const parseArgs = ({
  argv,
  env,
}: {
  argv: string[]
  env: NodeJS.ProcessEnv
}): ParseResult => {
  const flags = readFlags(argv)

  // Coalesce empty strings too: composite-action inputs arrive as "" (not unset)
  // on scheduled runs, and an empty value should fall through to the default.
  const scope = firstNonEmpty(flags.scope, env.INPUT_SCOPE, 'consumer-facing')
  const severity = firstNonEmpty(flags.severity, env.INPUT_SEVERITY, 'high')
  const jsonPath = firstNonEmpty(flags.json, env.INPUT_JSON, 'audit_output.json')

  if (!isScope(scope)) {
    return { error: `invalid scope '${scope}'. Valid values: ${SCOPES.join(', ')}`, ok: false }
  }
  if (!isSeverity(severity)) {
    return {
      error: `invalid severity '${severity}'. Valid values: ${SEVERITIES.join(', ')}`,
      ok: false,
    }
  }

  return { ok: true, options: { jsonPath, scope, severity } }
}

const firstNonEmpty = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    if (value !== undefined && value !== '') {
      return value
    }
  }
  return ''
}

const isScope = (value: string): value is Scope => SCOPES.some((scope) => scope === value)

const isSeverity = (value: string): value is Severity =>
  SEVERITIES.some((severity) => severity === value)

const readFlags = (argv: string[]): Record<string, string> => {
  const flags: Record<string, string> = {}
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg)
    if (match) {
      flags[match[1]] = match[2]
    }
  }
  return flags
}
