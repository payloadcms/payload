export type Autosave = {
  /**
   * Define an `interval` in milliseconds to automatically save progress while documents are edited.
   * Document updates are "debounced" at this interval.
   *
   * @default 800
   */
  interval?: number
}

export type IncomingDrafts = {
  /**
   * Enable autosave to automatically save progress while documents are edited.
   * To enable, set to true or pass an object with options.
   */
  autosave?: Autosave | boolean
  /**
   * Allow for editors to schedule publish / unpublish events in the future.
   */
  schedulePublish?: boolean
  /**
   * Set validate to true to validate draft documents when saved.
   *
   * @default false
   */
  validate?: boolean
}

export type SanitizedDrafts = {
  /**
   * Enable autosave to automatically save progress while documents are edited.
   * To enable, set to true or pass an object with options.
   */
  autosave: Autosave | false
  /**
   * Allow for editors to schedule publish / unpublish events in the future.
   */
  schedulePublish: boolean
  /**
   * Set validate to true to validate draft documents when saved.
   *
   * @default false
   */
  validate: boolean
}

export type IncomingCollectionVersions = {
  /**
   * Enable Drafts mode for this collection.
   * To enable, set to true or pass an object with draft options.
   */
  drafts?: boolean | IncomingDrafts
  /**
   * Use this setting to control how many versions to keep on a document by document basis.
   * Must be an integer. Use 0 to save all versions.
   *
   * @default 100
   */
  maxPerDoc?: number
}

export interface SanitizedCollectionVersions extends Omit<IncomingCollectionVersions, 'drafts'> {
  /**
   * Enable Drafts mode for this collection.
   * To enable, set to true or pass an object with draft options.
   */
  drafts: false | SanitizedDrafts
  /**
   * Use this setting to control how many versions to keep on a document by document basis.
   * Must be an integer. Use 0 to save all versions.
   *
   * @default 100
   */
  maxPerDoc: number
}

export type IncomingGlobalVersions = {
  drafts?: boolean | IncomingDrafts
  /**
   * Use this setting to control how many versions to keep on a global by global basis.
   * Must be an integer.
   */
  max?: number
}

export type SanitizedGlobalVersions = {
  /**
   * Enable Drafts mode for this global. To enable, set to true or pass an object with draft options
   */
  drafts: false | SanitizedDrafts
  /**
   * Use this setting to control how many versions to keep on a global by global basis.
   * Must be an integer.
   */
  max: number
}

export type TypeWithVersion<T> = {
  createdAt: string
  id: string
  parent: number | string
  publishedLocale?: string
  snapshot?: boolean
  updatedAt: string
  version: T
}
