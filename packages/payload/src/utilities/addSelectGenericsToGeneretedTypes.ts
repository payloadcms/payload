export const addSelectGenericsToGeneratedTypes = ({
  compiledGeneratedTypes,
}: {
  compiledGeneratedTypes: string
}) => {
  const modifiedLines = []

  let isCollectionsSelectToken = false
  let isSelectTypeToken = false

  for (const line of compiledGeneratedTypes.split('\n')) {
    let newLine = line
    if (line === `  collectionsSelect?: {` || line === `  globalsSelect?: {`) {
      isCollectionsSelectToken = true
    }

    if (isCollectionsSelectToken) {
      if (line === '  };') {
        isCollectionsSelectToken = false
      } else {
        // replace <posts: PostsSelect;> with <posts: PostsSelect<true> | PostsSelect<false;>
        newLine = line.replace(/(['"]?\w+['"]?):\s*(\w+);/g, (_, variable, type) => {
          return `${variable}: ${type}<false> | ${type}<true>;`
        })
      }
    }

    // eslint-disable-next-line regexp/no-unused-capturing-group
    if (line.match(/via the `definition` "([\w-]+_select)"/g)) {
      isSelectTypeToken = true
    }

    if (isSelectTypeToken) {
      if (line.startsWith('export interface')) {
        // add generic to the interface
        newLine = line.replace(/(export interface\s+\w+)(\s*\{)/g, '$1<T extends boolean = true>$2')
      } else {
        // replace booleans with T on the line
        newLine = line.replace(/(?<!\?)\bboolean\b/g, 'T')

        if (line === '}') {
          isSelectTypeToken = false
        }
      }
    }

    modifiedLines.push(newLine)
  }

  return modifiedLines.join('\n')
}
