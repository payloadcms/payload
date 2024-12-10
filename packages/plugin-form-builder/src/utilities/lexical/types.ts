export type HTMLConverter<T = any> = {
  converter: ({
    childIndex,
    converters,
    node,
    parent,
    submissionData,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parent: SerializedLexicalNodeWithParent
    submissionData?: any
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = {
  parent?: any
} & any
