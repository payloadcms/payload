import * as acorn from 'acorn'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxJsxFromMarkdown } from 'mdast-util-mdx-jsx'
import { mdxJsx } from 'micromark-extension-mdx-jsx'

export type AST = ReturnType<typeof fromMarkdown>

export function parseJSXToAST({
  jsxString,
  keepPositions,
}: {
  jsxString: string
  keepPositions?: boolean
}): AST {
  const treeComplex: AST = fromMarkdown(jsxString, {
    extensions: [mdxJsx({ acorn, addResult: false })],
    mdastExtensions: [mdxJsxFromMarkdown()],
  })

  // Remove "position" keys
  const parseTree = (tree: object) => {
    for (const key in tree) {
      if (key === 'position' && tree[key].start && tree[key].end) {
        delete tree[key]
      } else if (typeof tree[key] === 'object') {
        parseTree(tree[key])
      } else if (Array.isArray(tree[key])) {
        for (const item of tree[key]) {
          parseTree(item)
        }
      }
    }
  }

  const tree: AST = treeComplex

  if (keepPositions !== true) {
    parseTree(tree)
  }

  return tree
}
