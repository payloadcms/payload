import type { Where } from '../types/index.js'

export const prefixWherePaths = ({ prefix, where }: { prefix: string; where: Where }): Where => {
  const prefixedWhere: Where = {}

  for (const [key, value] of Object.entries(where)) {
    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(value)) {
      prefixedWhere[key] = value.map((nestedWhere) =>
        prefixWherePaths({ prefix, where: nestedWhere }),
      )
    } else {
      prefixedWhere[`${prefix}.${key}`] = value
    }
  }

  return prefixedWhere
}
