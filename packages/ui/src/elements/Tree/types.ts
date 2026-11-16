export type TreePosition = {
  ancestorContinues: boolean[]
  indent: number
  isLastRendered: boolean
  isLastSibling: boolean
}

export type TreeItemVariant = 'continuation' | 'default' | 'group'
