import { fromMarkdown } from 'mdast-util-from-markdown';
export type AST = ReturnType<typeof fromMarkdown>;
export declare function parseJSXToAST({ jsxString, keepPositions, }: {
    jsxString: string;
    keepPositions?: boolean;
}): AST;
//# sourceMappingURL=mdx.d.ts.map