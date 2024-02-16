import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { DocumentInfoContext } from '../providers/DocumentInfo'

export type DocumentTabCondition = (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  documentInfo: DocumentInfoContext
  globalConfig: SanitizedGlobalConfig
}) => boolean

// Everything is optional because we merge in the defaults
// i.e. the config may override the `Default` view with a `label` but not an `href`
export type DocumentTabConfig = {
  Tab?: React.ComponentType<DocumentTabProps>
  href?: string
  // isActive?: ((args: { href: string }) => boolean) | boolean
  label?: string
  newTab?: boolean
}

export type DocumentTabComponent = React.ComponentType<{
  path: string
}>

export type DocumentTab = DocumentTabComponent | DocumentTabConfig
