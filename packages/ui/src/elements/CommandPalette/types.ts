export type CommandPaletteActionType = 'collection' | 'global'

export type CommandPaletteAction = {
  /** href used by ⌘⏎ to create a new document; collections with create permission only. */
  createHref?: string
  /** href for the primary action (⏎): collection list view or global edit view. */
  href: string
  /** Stable unique id, also used for the option's DOM id. */
  id: string
  /** Pre-translated label shown to the user and used for fuzzy matching. */
  label: string
  type: CommandPaletteActionType
}

export type CommandPaletteGroup = {
  actions: CommandPaletteAction[]
  /** Pre-translated group heading. */
  label: string
}
