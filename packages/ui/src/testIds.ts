/** Normalize field path separators: dots → double underscores to match HTML ID conventions */
const n = (fieldPath: string) => fieldPath.replace(/\./g, '__')

export const testIds = {
  // Navigation
  nav: {
    logoutButton: 'nav-logout',
    menuItem: (slug: string) => `nav-item-${slug}`,
    sidebar: 'nav-sidebar',
    toggler: 'nav-toggler',
  },

  // Document actions
  action: {
    delete: 'action-delete',
    duplicate: 'action-duplicate',
    publish: 'action-publish',
    publishLocale: 'publish-locale',
    restore: 'action-restore',
    save: 'action-save',
    saveDraft: 'action-save-draft',
  },

  // Fields (dynamic by path)
  field: (path: string) => `field-${n(path)}`,

  // Table/List
  table: {
    cell: (fieldName: string) => `cell-${n(fieldName)}`,
    row: (index: number) => `table-row-${index}`,
    selectAll: 'select-all',
    selectRow: (index: number) => `select-row-${index}`,
  },

  // Drawers
  drawer: {
    close: (id: string) => `drawer-close-${id}`,
    content: (id: string) => `drawer-content-${id}`,
  },

  // Array fields
  array: {
    addRow: (fieldName: string) => `${n(fieldName)}-add-row`,
    row: (fieldName: string, index: number) => `${n(fieldName)}-row-${index}`,
    rowActions: (fieldName: string, index: number) => `${n(fieldName)}-row-actions-${index}`,
  },

  // Block fields
  blocks: {
    addButton: (fieldName: string) => `${n(fieldName)}-blocks-add`,
    blockOption: (blockSlug: string) => `block-option-${blockSlug}`,
    drawer: 'blocks-drawer',
    row: (fieldName: string, index: number) => `${n(fieldName)}-block-${index}`,
  },

  // List controls
  list: {
    columns: 'list-columns',
    deleteMany: 'delete-many',
    editMany: 'edit-many',
    filters: 'list-filters',
    menu: 'list-menu',
    search: 'list-search',
  },

  // Locale
  locale: {
    option: (code: string) => `locale-option-${code}`,
    selector: 'locale-selector',
  },

  // Collapsible
  collapsible: {
    toggle: (label: string) => `collapsible-${label}`,
  },

  // Relationship
  relationship: {
    addNew: (fieldName: string) => `${n(fieldName)}-add-new`,
    drawerToggle: (fieldName: string) => `${n(fieldName)}-drawer-toggle`,
    value: (fieldName: string) => `${n(fieldName)}-value`,
  },

  // Tabs
  tab: (label: string) => `tab-${label}`,

  // Doc header
  docHeader: {
    breadcrumb: 'breadcrumb-last',
    title: 'doc-header-title',
  },

  // Doc controls
  docControls: {
    menu: 'doc-controls-menu',
  },

  // Upload
  upload: {
    field: (fieldName: string) => `${n(fieldName)}-upload`,
    filename: (fieldName: string) => `${n(fieldName)}-filename`,
  },

  // Popup
  popup: {
    content: 'popup-content',
  },

  // Array/Block row action menu items
  arrayAction: {
    add: 'array-action-add',
    copyField: 'array-action-copy',
    duplicate: 'array-action-duplicate',
    moveDown: 'array-action-move-down',
    moveUp: 'array-action-move-up',
    pasteField: 'array-action-paste',
    remove: 'array-action-remove',
  },

  // Where builder / filters
  whereBuilder: {
    addFirstFilter: 'where-builder-add-first',
    addOr: 'where-builder-add-or',
    condition: {
      field: 'condition-field',
      operator: 'condition-operator',
      value: 'condition-value',
    },
    root: 'where-builder',
  },

  // Live preview
  livePreview: {
    breakpoint: 'live-preview-breakpoint',
    toggler: 'live-preview-toggler',
    zoom: 'live-preview-zoom',
  },

  // Confirmation modals
  confirm: {
    action: 'confirm-action',
    cancel: 'confirm-cancel',
  },

  // Group by
  groupBy: {
    container: 'list-controls-group-by',
    fieldSelect: 'group-by-field-select',
    reset: 'group-by-reset',
    toggle: 'toggle-group-by',
  },

  // Filter controls
  filterControls: {
    container: 'list-controls-where',
    toggle: 'toggle-list-filters',
  },
} as const
