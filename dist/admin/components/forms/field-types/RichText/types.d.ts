import { RichTextField } from '../../../../../fields/config/types';
export type Props = Omit<RichTextField, 'type'> & {
    path?: string;
};
export type TextNode = {
    text: string;
    [x: string]: unknown;
};
export type ElementNode = {
    type?: string;
    children: (TextNode | ElementNode)[];
};
export declare function nodeIsTextNode(node: TextNode | ElementNode): node is TextNode;
