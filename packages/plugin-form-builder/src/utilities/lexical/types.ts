export type HTMLConverter<T = any> = {
  converter: ({
    childIndex,
    converters,
    node,
    parent,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parent: SerializedLexicalNodeWithParent
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = any & {
  parent?: any
}
