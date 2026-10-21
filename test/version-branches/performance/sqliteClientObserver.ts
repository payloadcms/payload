import type { Client } from '@libsql/client'

type Observer = (args: { client: Client; isNew: boolean }) => void

const clients = new Set<WeakRef<Client>>()
const registered = new WeakSet<Client>()
let observer: Observer | undefined
let creationFailed: (() => void) | undefined

export const createPerformanceSqliteClient = ({ create }: { create: () => Client }): Client => {
  let client: Client

  try {
    client = create()
  } catch (error) {
    creationFailed?.()
    throw error
  }
  return registerPerformanceSqliteClient({ client })
}

/** Test-only factory boundary: return the actual driver instance without substituting its session. */
export const registerPerformanceSqliteClient = ({ client }: { client: Client }): Client => {
  if (!registered.has(client)) {
    registered.add(client)
    clients.add(new WeakRef(client))
    observer?.({ client, isNew: true })
  }
  return client
}

/** Include retained clients that fixture setup created before measurement began. */
export const observePerformanceSqliteClients = ({
  observe,
  onCreationFailed,
}: {
  observe: Observer
  onCreationFailed: () => void
}): (() => void) => {
  if (observer) {
    throw new Error('SQLite performance client observation is already active.')
  }
  observer = observe
  creationFailed = onCreationFailed
  try {
    for (const reference of clients) {
      const client = reference.deref()

      if (!client || client.closed) {
        clients.delete(reference)
      } else {
        observe({ client, isNew: false })
      }
    }
  } catch (error) {
    observer = undefined
    creationFailed = undefined
    throw error
  }
  return () => {
    if (observer === observe) {
      observer = undefined
      creationFailed = undefined
    }
  }
}
