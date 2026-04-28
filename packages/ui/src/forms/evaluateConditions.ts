type ConditionContext = {
  blockData: unknown
  operation: 'create' | 'update' | undefined
  user: unknown
}

type ConditionFn = (data: unknown, siblingData: unknown, ctx: ConditionContext) => boolean

export type EvaluateConditionsField = {
  condition?: ConditionFn
  path: string
  siblingData?: unknown
}

export type EvaluateConditionsArgs = {
  context: ConditionContext
  data: unknown
  fields: EvaluateConditionsField[]
}

export function evaluateConditions(args: EvaluateConditionsArgs): Map<string, boolean> {
  const result = new Map<string, boolean>()
  const sorted = [...args.fields].sort((a, b) => depth(a.path) - depth(b.path))

  for (const field of sorted) {
    if (isAnyAncestorHidden(field.path, result)) {
      result.set(field.path, false)
      continue
    }

    if (!field.condition) {
      result.set(field.path, true)
      continue
    }

    const ret = field.condition(args.data, field.siblingData, args.context)
    if (isPromise(ret)) {
      throw new Error(`Condition at ${field.path} must be synchronous; got a Promise.`)
    }
    result.set(field.path, Boolean(ret))
  }

  return result
}

function depth(path: string): number {
  return path.split('.').length
}

function isAnyAncestorHidden(path: string, result: Map<string, boolean>): boolean {
  const parts = path.split('.')
  for (let i = 1; i < parts.length; i++) {
    const ancestor = parts.slice(0, i).join('.')
    if (result.get(ancestor) === false) {
      return true
    }
  }
  return false
}

function isPromise(value: unknown): boolean {
  return Boolean(value) && typeof (value as { then?: unknown }).then === 'function'
}
