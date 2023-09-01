import type { RichTextField } from '../../../../../fields/config/types';

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}

export type TextNode = { [x: string]: unknown;text: string }

export type ElementNode = { children: (ElementNode | TextNode)[]; type?: string }

export function nodeIsTextNode(node: ElementNode | TextNode): node is TextNode {
  return 'text' in node;
}

export interface RichTextAdapter {
  component: React.FC<Props>;
}
