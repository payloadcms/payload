import type { LinkFields } from '../../nodes/LinkNode'

/**
 * The payload of a link node
 * This can be delivered from the link node to the drawer, or from the drawer/anything to the TOGGLE_LINK_COMMAND
 */
export type LinkPayload = {
  fields: LinkFields
  /**
   * The text content of the link node - will be displayed in the drawer
   */
  text: null | string
}
