/**
 * Helpful utility for parsing out all matching top-level JSX tags in a given string.
 * This will collect them in a list, that contains the content of the JSX tag and the props string.
 *
 * While this is not used within payload, this can be used for certain payload blocks that need to
 * be serializable and deserializable to and from JSX.
 *
 * @example:
 *
 * Say you have Steps block that contains a steps array. Its JSX representation may look like this:
 *
 * <Steps>
 *   <Step title="Step1">
 *     <h1>Step 1</h1>
 *   </Step>
 *   <Step title="Step2">
 *     <h1>Step 2</h1>
 *   </Step>
 * </Steps>
 *
 * In this case, the Steps block would have the following content as its children string:
 * <Step title="Step1">
 *   <h1>Step 1</h1>
 * </Step>
 * <Step title="Step2">
 *   <h1>Step 2</h1>
 * </Step>
 *
 * It could then use this function to collect all the top-level JSX tags (= the steps):
 *
 * collectTopLevelJSXInLines(children.split('\n'), 'Step')
 *
 * This will return:
 *
 * [
 *   {
 *     content: '<h1>Step 1</h1>',
 *     propsString: 'title="Step1"',
 *   },
 *   {
 *     content: '<h1>Step 2</h1>',
 *     propsString: 'title="Step2"',
 *   },
 * ]
 *
 * You can then map this data to construct the data for this blocks array field.
 */
export declare function collectTopLevelJSXInLines(lines: Array<string>, jsxToMatch: string): {
    content: string;
    propsString: string;
}[];
//# sourceMappingURL=collectTopLevelJSXInLines.d.ts.map