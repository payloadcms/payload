// nullish only so 0 / false stay as real filter values
export function resolveWhereValue(raw: unknown): unknown {
  return raw ?? undefined
}
