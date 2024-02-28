import type { I18n } from '@payloadcms/translations'
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'

import { $findMatchingParent } from '@lexical/utils'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'
import type { SerializedAutoLinkNode } from './nodes/AutoLinkNode'
import type { LinkFields, SerializedLinkNode } from './nodes/LinkNode'

import { getSelectedNode } from '../../lexical/utils/getSelectedNode'
import { FeaturesSectionWithEntries } from '../common/floatingSelectToolbarFeaturesButtonsSection'
import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { LinkFeatureClientComponent, nodes } from './ClientComponent'
import { AutoLink, Link } from './nodes'
import { AutoLinkNode } from './nodes/AutoLinkNode'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from './nodes/LinkNode'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './plugins/floatingLinkEditor/LinkEditor/commands'
import { linkPopulationPromiseHOC } from './populationPromise'
import { key } from './shared'

type ExclusiveLinkCollectionsProps =
  | {
      /**
       * The collections that should be disabled for internal linking. Overrides the `enableRichTextLink` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: string[]

      // Ensures that enabledCollections is not available when disabledCollections is set
      enabledCollections?: never
    }
  | {
      // Ensures that disabledCollections is not available when enabledCollections is set
      disabledCollections?: never

      /**
       * The collections that should be enabled for internal linking. Overrides the `enableRichTextLink` property in the collection config
       * When this property is set, `disabledCollections` will not be available.
       **/
      enabledCollections?: string[]
    }

export type LinkFeatureProps = ExclusiveLinkCollectionsProps & {
  /**
   * A function or array defining additional fields for the link feature. These will be
   * displayed in the link editor drawer.
   */
  fields?:
    | ((args: { config: SanitizedConfig; defaultFields: Field[]; i18n: I18n }) => Field[])
    | Field[]
}

// export const LinkFeature = (props: LinkFeatureProps): FeatureProvider => {
//   return {
//     feature: () => {
//       return {
//         ClientComponent: LinkFeatureClientComponent,
//         createClientProps: (props) => props // safe,
//         nodes: [
//           {
//             node: LinkNode,
//             populationPromises: []
//           }
//         ],
//         key: key,
//       }
//     }
//   }
// }
