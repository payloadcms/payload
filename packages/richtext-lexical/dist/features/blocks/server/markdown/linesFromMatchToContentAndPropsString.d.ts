export declare function linesFromStartToContentAndPropsString({ isEndOptional, lines, regexpEndRegex, startLineIndex, startMatch, trimChildren, }: {
    isEndOptional?: boolean;
    lines: string[];
    regexpEndRegex?: RegExp;
    startLineIndex: number;
    startMatch: RegExpMatchArray;
    trimChildren?: boolean;
}): {
    /**
     * The matched string after the end match, in the same line as the end match. Useful for inline matches.
     */
    afterEndLine: string;
    /**
     * The matched string before the start match, in the same line as the start match. Useful for inline matches.
     */
    beforeStartLine: string;
    content: string;
    endLineIndex: number;
    endlineLastCharIndex: number;
    propsString: string;
};
//# sourceMappingURL=linesFromMatchToContentAndPropsString.d.ts.map