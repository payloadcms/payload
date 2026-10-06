/** A migration error that cannot be suppressed as a missing-document result. */
export class RemovedArgumentError extends Error {
  constructor({ key }: { key: string }) {
    super(`The "${key}" parameter has been removed. Use "version" and "locale" instead.`)
    this.name = 'RemovedArgumentError'
  }
}
