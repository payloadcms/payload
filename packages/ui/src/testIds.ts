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
  field: (path: string) => `field-${path.replace(/\./g, '__')}`,

  // Toast notifications
  toast: {
    closeButton: 'toast-close-button',
    container: 'toast-container',
    error: 'toast-error',
    success: 'toast-success',
  },

  // Table/List
  table: {
    cell: (fieldName: string) => `cell-${fieldName}`,
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
    addRow: (fieldName: string) => `${fieldName}-add-row`,
    row: (fieldName: string, index: number) => `${fieldName}-row-${index}`,
    rowActions: (fieldName: string, index: number) => `${fieldName}-row-actions-${index}`,
  },

  // Block fields
  blocks: {
    addButton: (fieldName: string) => `${fieldName}-blocks-add`,
    blockOption: (blockSlug: string) => `block-option-${blockSlug}`,
    drawer: 'blocks-drawer',
    row: (fieldName: string, index: number) => `${fieldName}-block-${index}`,
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
    addNew: (fieldName: string) => `${fieldName}-add-new`,
    drawerToggle: (fieldName: string) => `${fieldName}-drawer-toggle`,
    value: (fieldName: string) => `${fieldName}-value`,
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
    field: (fieldName: string) => `${fieldName}-upload`,
    filename: (fieldName: string) => `${fieldName}-filename`,
  },
} as const
