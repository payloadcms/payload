type Deferred = { entries: Entry[]; load: () => void; prefix: string }
type Entry = string | Deferred

/** Defer native editor branches while preserving Map insertion order and mutation semantics. */
export class DeferredSchemaMap<Value> extends Map<string, Value> {
  private materialized = false
  private entriesInOrder: Entry[] = []
  private recording = this.entriesInOrder
  private pending = new Map<string, Deferred>()

  defer(prefix: string, load: () => void): void {
    if (this.materialized) {
      this.entriesInOrder = [...super.keys()]
      this.recording = this.entriesInOrder
      this.materialized = false
    }
    const branch = { entries: [], load, prefix }
    this.pending.set(prefix, branch)
    this.recording.push(branch)
  }

  private expand(branch: Deferred): void {
    if (!this.pending.delete(branch.prefix)) return
    const previous = this.recording
    this.recording = branch.entries
    try {
      branch.load()
    } finally {
      this.recording = previous
    }
  }

  private resolve(key: string): void {
    // Expanding a parent can register deeper branches, so resolve from root to leaf.
    for (let end = key.indexOf('.'); end >= 0; end = key.indexOf('.', end + 1)) {
      const branch = this.pending.get(key.slice(0, end))
      if (branch) this.expand(branch)
    }
    const branch = this.pending.get(key)
    if (branch) this.expand(branch)
  }

  override get(key: string): Value | undefined {
    this.resolve(key)
    return super.get(key)
  }

  override has(key: string): boolean {
    this.resolve(key)
    return super.has(key)
  }

  override set(key: string, value: Value): this {
    this.resolve(key)
    if (!this.materialized && !super.has(key)) this.recording.push(key)
    return super.set(key, value)
  }

  private materialize(): void {
    if (!this.entriesInOrder.length) return
    const ordered = new Map<string, Value>()
    const visit = (entries: Entry[]) => {
      for (const entry of entries) {
        if (typeof entry === 'string') ordered.set(entry, super.get(entry)!)
        else {
          this.expand(entry)
          visit(entry.entries)
        }
      }
    }
    visit(this.entriesInOrder)
    // Values may have been overridden by a later branch.
    for (const key of ordered.keys()) ordered.set(key, super.get(key)!)
    for (const [key, value] of super.entries()) if (!ordered.has(key)) ordered.set(key, value)
    super.clear()
    for (const [key, value] of ordered) super.set(key, value)
    this.materialized = true
    this.entriesInOrder = []
    this.recording = this.entriesInOrder
  }

  override get size() {
    this.materialize()
    return super.size
  }
  override entries() {
    this.materialize()
    return super.entries()
  }
  override keys() {
    this.materialize()
    return super.keys()
  }
  override values() {
    this.materialize()
    return super.values()
  }
  override [Symbol.iterator]() {
    return this.entries()
  }
  override forEach(
    callback: (value: Value, key: string, map: Map<string, Value>) => void,
    thisArg?: unknown,
  ): void {
    this.materialize()
    super.forEach(callback, thisArg)
  }
  override delete(key: string): boolean {
    this.materialize()
    return super.delete(key)
  }
  override clear(): void {
    this.pending.clear()
    this.materialized = true
    this.entriesInOrder = []
    this.recording = this.entriesInOrder
    super.clear()
  }
}
