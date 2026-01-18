/**
 * Converts an object of props to a JSX props string.
 *
 * This function is the inverse of `extractPropsFromJSXPropsString`.
 */
export declare function propsToJSXString({ props }: {
    props: Record<string, any>;
}): string;
/**
 * Converts a frontmatter string to an object.
 */
export declare function frontmatterToObject(frontmatter: string): Record<string, any>;
/**
 * Converts an object to a frontmatter string.
 */
export declare function objectToFrontmatter(obj: Record<string, any>): null | string;
/**
 * Takes an MDX content string and extracts the frontmatter and content.
 *
 * The resulting object contains the mdx content without the frontmatter and the frontmatter itself.
 */
export declare function extractFrontmatter(mdxContent: string): {
    content: string;
    frontmatter: string;
};
//# sourceMappingURL=jsx.d.ts.map