/**
 * Turns a JSX props string into an object.
 *
 * @example
 *
 * Input: type="info" hello={{heyyy: 'test', someNumber: 2}}
 * Output: { type: 'info', hello: { heyyy: 'test', someNumber: 2 } }
 */
export declare function extractPropsFromJSXPropsString({ propsString, }: {
    propsString: string;
}): Record<string, any>;
//# sourceMappingURL=extractPropsFromJSXPropsString.d.ts.map