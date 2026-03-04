import type { Where } from '../../../types/index.js'

/**
 * Builds a `where` fragment that scopes order operations to docs sharing the
 * same join `on` field value.
 */
export function buildJoinScopeWhere(args: {
  joinOnFieldPath: string
  scopeValue: unknown
}): null | Where {
  const { joinOnFieldPath, scopeValue } = args

  if (typeof scopeValue === 'undefined') {
    return null
  }

  if (Array.isArray(scopeValue)) {
    return buildJoinScopeWhere({
      joinOnFieldPath,
      scopeValue: scopeValue[0],
    })
  }

  if (
    scopeValue &&
    typeof scopeValue === 'object' &&
    'relationTo' in scopeValue &&
    'value' in scopeValue
  ) {
    const relation = (scopeValue as { relationTo?: unknown }).relationTo
    const value = (scopeValue as { value?: unknown }).value

    if (typeof relation === 'undefined' || typeof value === 'undefined') {
      return null
    }

    return {
      and: [
        {
          [`${joinOnFieldPath}.relationTo`]: {
            equals: relation,
          },
        },
        {
          [`${joinOnFieldPath}.value`]: {
            equals: value,
          },
        },
      ],
    }
  }

  return {
    [joinOnFieldPath]: {
      equals: scopeValue,
    },
  }
}
