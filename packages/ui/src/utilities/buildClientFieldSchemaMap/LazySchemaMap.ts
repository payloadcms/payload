/** A Map adapter that converts rich-text schemas only when a caller requests them. */
export class LazySchemaMap<Source, Value> extends Map<string, Value> {
  private readonly source: Map<string, Source>
  private readonly convert: (source: Source) => Value
  private order: (string | { prefix: string })[] = []
  private readonly prefixes = new Set<string>()

  constructor({
    source,
    convert,
  }: {
    source: Map<string, Source>
    convert: (source: Source) => Value
  }) {
    super()
    this.source = source
    this.convert = convert
  }

  defer(prefix: string): void {
    this.prefixes.add(prefix)
    this.order.push({ prefix })
  }

  override set(key: string, value: Value): this {
    if (!super.has(key)) this.order.push(key)
    return super.set(key, value)
  }

  override get(key: string): undefined | Value {
    if (super.has(key)) return super.get(key)
    if (this.isDeferred(key) && this.source.has(key)) return this.convert(this.source.get(key)!)
  }

  override has(key: string): boolean {
    return super.has(key) || (this.isDeferred(key) && this.source.has(key))
  }

  override get size(): number {
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

  override forEach(
    callback: (value: Value, key: string, map: Map<string, Value>) => void,
    thisArg?: unknown,
  ): void {
    this.materialize()
    super.forEach(callback, thisArg)
  }

  override [Symbol.iterator]() {
    return this.entries()
  }

  override delete(key: string): boolean {
    this.materialize()
    return super.delete(key)
  }

  override clear(): void {
    this.prefixes.clear()
    this.order = []
    super.clear()
  }

  private isDeferred(key: string): boolean {
    if (typeof key !== 'string') return false
    for (let end = key.lastIndexOf('.'); end >= 0; end = key.lastIndexOf('.', end - 1)) {
      if (this.prefixes.has(key.slice(0, end))) return true
      if (end === 0) break
    }
    return false
  }

  private materialize(): void {
    if (!this.prefixes.size) return
    const ordered = new Map<string, Value>()
    for (const entry of this.order) {
      if (typeof entry === 'string') {
        if (!ordered.has(entry)) ordered.set(entry, super.get(entry)!)
      } else {
        for (const [key, value] of this.source) {
          if (key.startsWith(entry.prefix + '.') && !ordered.has(key)) {
            ordered.set(key, super.has(key) ? super.get(key)! : this.convert(value))
          }
        }
      }
    }
    super.clear()
    for (const [key, value] of ordered) super.set(key, value)
    this.order = []
    this.prefixes.clear()
  }
}
