import { linesFromStartToContentAndPropsString } from '../../features/blocks/server/linesFromMatchToContentAndPropsString.js'
import { createTagRegexes } from '../../features/blocks/server/markdownTransformer.js'

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
export function collectTopLevelJSXInLines(
  lines: Array<string>,
  jsxToMatch: string,
): {
  content: string
  propsString: string
}[] {
  const finds: {
    content: string
    propsString: string
  }[] = []
  const regex = createTagRegexes(jsxToMatch)

  const linesLength = lines.length

  for (let i = 0; i < linesLength; i++) {
    const line = lines[i]!
    const startMatch = line.match(regex.regExpStart)
    if (!startMatch) {
      continue // Try next transformer
    }

    const { content, endLineIndex, propsString } = linesFromStartToContentAndPropsString({
      isEndOptional: false,
      lines,
      regexpEndRegex: regex.regExpEnd,
      startLineIndex: i,
      startMatch,
    })

    finds.push({
      content,
      propsString,
    })

    i = endLineIndex
    continue
  }

  return finds
}
