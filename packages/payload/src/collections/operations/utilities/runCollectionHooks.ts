/**
 * Runs a collection hook array sequentially, threading the result of each hook into the
 * next. A hook that returns nothing keeps the previous value — the same fallback semantics
 * every hand-rolled `for (const hook of ...) { result = (await hook(...)) || result }` loop
 * across the collection operation files used.
 */
export const runCollectionHooks = async <THook, TPayload>({
  hooks,
  invoke,
  payload,
}: {
  hooks: THook[] | undefined
  invoke: (hook: THook, current: TPayload) => Promise<TPayload | undefined | void>
  payload: TPayload
}): Promise<TPayload> => {
  if (!hooks?.length) {
    return payload
  }

  let current = payload

  for (const hook of hooks) {
    const result = await invoke(hook, current)
    current = result ?? current
  }

  return current
}
