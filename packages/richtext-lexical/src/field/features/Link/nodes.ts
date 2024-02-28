import { AutoLinkNode } from './nodes/AutoLinkNode'
import { LinkNode } from './nodes/LinkNode'

export const Link = {
  type: LinkNode.getType(),
  node: LinkNode,
}

export const AutoLink = {
  type: AutoLinkNode.getType(),
  node: AutoLinkNode,
}
