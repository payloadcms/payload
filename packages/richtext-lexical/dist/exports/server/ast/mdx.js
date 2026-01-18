import * as acorn from 'acorn';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx';
import { mdxJsx } from 'micromark-extension-mdx-jsx';
export function parseJSXToAST({
  jsxString,
  keepPositions
}) {
  const treeComplex = fromMarkdown(jsxString, {
    extensions: [mdxJsx({
      acorn,
      addResult: false
    })],
    mdastExtensions: [mdxJsxFromMarkdown()]
  });
  // Remove "position" keys
  const parseTree = tree => {
    for (const key in tree) {
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      if (key === 'position' && tree[key].start && tree[key].end) {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        delete tree[key];
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      } else if (typeof tree[key] === 'object') {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        parseTree(tree[key]);
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      } else if (Array.isArray(tree[key])) {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        for (const item of tree[key]) {
          parseTree(item);
        }
      }
    }
  };
  const tree = treeComplex;
  if (keepPositions !== true) {
    parseTree(tree);
  }
  return tree;
}
//# sourceMappingURL=mdx.js.map