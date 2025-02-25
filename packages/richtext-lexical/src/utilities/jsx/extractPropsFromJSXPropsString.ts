import { JSOX } from 'jsox'

/**
 * Turns a JSX props string into an object.
 *
 * @example
 *
 * Input: type="info" hello={{heyyy: 'test', someNumber: 2}}
 * Output: { type: 'info', hello: { heyyy: 'test', someNumber: 2 } }
 */
export function extractPropsFromJSXPropsString({
  propsString,
}: {
  propsString: string
}): Record<string, any> {
  const props: Record<string, any> = {}
  let key = ''
  let collectingKey = true

  for (let i = 0; i < propsString.length; i++) {
    const char = propsString[i]

    if (collectingKey) {
      if (char === '=' || char === ' ') {
        if (key) {
          if (char === ' ') {
            props[key] = true
            key = ''
          } else {
            collectingKey = false
          }
        }
      } else {
        key += char
      }
    } else {
      const result = handleValue(propsString, i)
      props[key] = result.value
      i = result.newIndex
      key = ''
      collectingKey = true
    }
  }

  if (key) {
    props[key] = true
  }

  return props
}

function handleValue(propsString: string, startIndex: number): { newIndex: number; value: any } {
  const char = propsString[startIndex]

  if (char === '"') {
    return handleQuotedString(propsString, startIndex)
  } else if (char === "'") {
    return handleQuotedString(propsString, startIndex, true)
  } else if (char === '{') {
    return handleObject(propsString, startIndex)
  } else if (char === '[') {
    return handleArray(propsString, startIndex)
  } else {
    return handleUnquotedString(propsString, startIndex)
  }
}

function handleArray(propsString: string, startIndex: number): { newIndex: number; value: any } {
  let bracketCount = 1
  let value = ''
  let i = startIndex + 1

  while (i < propsString.length && bracketCount > 0) {
    if (propsString[i] === '[') {
      bracketCount++
    } else if (propsString[i] === ']') {
      bracketCount--
    }
    if (bracketCount > 0) {
      value += propsString[i]
    }
    i++
  }

  return { newIndex: i, value: JSOX.parse(`[${value}]`) }
}

function handleQuotedString(
  propsString: string,
  startIndex: number,
  isSingleQuoted = false,
): { newIndex: number; value: string } {
  let value = ''
  let i = startIndex + 1
  while (
    i < propsString.length &&
    (propsString[i] !== (isSingleQuoted ? "'" : '"') || propsString[i - 1] === '\\')
  ) {
    value += propsString[i]
    i++
  }
  return { newIndex: i, value }
}

function handleObject(propsString: string, startIndex: number): { newIndex: number; value: any } {
  let bracketCount = 1
  let value = ''
  let i = startIndex + 1

  while (i < propsString.length && bracketCount > 0) {
    if (propsString[i] === '{') {
      bracketCount++
    } else if (propsString[i] === '}') {
      bracketCount--
    }
    if (bracketCount > 0) {
      value += propsString[i]
    }
    i++
  }

  return { newIndex: i, value: parseObject(value) }
}

function parseObject(objString: string): Record<string, any> {
  if (objString[0] !== '{') {
    return JSOX.parse(objString)
  }

  const result = JSOX.parse(objString.replace(/(\w+):/g, '"$1":'))

  return result
}

function handleUnquotedString(
  propsString: string,
  startIndex: number,
): { newIndex: number; value: string } {
  let value = ''
  let i = startIndex
  while (i < propsString.length && propsString[i] !== ' ') {
    value += propsString[i]
    i++
  }
  return { newIndex: i - 1, value }
}
