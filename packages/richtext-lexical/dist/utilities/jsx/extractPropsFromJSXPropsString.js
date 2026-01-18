import { JSOX } from 'jsox';
/**
 * Turns a JSX props string into an object.
 *
 * @example
 *
 * Input: type="info" hello={{heyyy: 'test', someNumber: 2}}
 * Output: { type: 'info', hello: { heyyy: 'test', someNumber: 2 } }
 */
export function extractPropsFromJSXPropsString({
  propsString
}) {
  const props = {};
  let key = '';
  let collectingKey = true;
  for (let i = 0; i < propsString.length; i++) {
    const char = propsString[i];
    if (collectingKey) {
      if (char === '=' || char === ' ') {
        if (key) {
          if (char === ' ') {
            props[key] = true;
            key = '';
          } else {
            collectingKey = false;
          }
        }
      } else {
        key += char;
      }
    } else {
      const result = handleValue(propsString, i);
      props[key] = result.value;
      i = result.newIndex;
      key = '';
      collectingKey = true;
    }
  }
  if (key) {
    props[key] = true;
  }
  return props;
}
function handleValue(propsString, startIndex) {
  const char = propsString[startIndex];
  if (char === '"') {
    return handleQuotedString(propsString, startIndex);
  } else if (char === "'") {
    return handleQuotedString(propsString, startIndex, true);
  } else if (char === '{') {
    return handleObject(propsString, startIndex);
  } else if (char === '[') {
    return handleArray(propsString, startIndex);
  } else {
    return handleUnquotedString(propsString, startIndex);
  }
}
function handleArray(propsString, startIndex) {
  let bracketCount = 1;
  let value = '';
  let i = startIndex + 1;
  while (i < propsString.length && bracketCount > 0) {
    if (propsString[i] === '[') {
      bracketCount++;
    } else if (propsString[i] === ']') {
      bracketCount--;
    }
    if (bracketCount > 0) {
      value += propsString[i];
    }
    i++;
  }
  return {
    newIndex: i,
    value: JSOX.parse(`[${value}]`)
  };
}
function handleQuotedString(propsString, startIndex, isSingleQuoted = false) {
  let value = '';
  let i = startIndex + 1;
  while (i < propsString.length && (propsString[i] !== (isSingleQuoted ? "'" : '"') || propsString[i - 1] === '\\')) {
    value += propsString[i];
    i++;
  }
  return {
    newIndex: i,
    value
  };
}
function handleObject(propsString, startIndex) {
  let bracketCount = 1;
  let value = '';
  let i = startIndex + 1;
  while (i < propsString.length && bracketCount > 0) {
    if (propsString[i] === '{') {
      bracketCount++;
    } else if (propsString[i] === '}') {
      bracketCount--;
    }
    if (bracketCount > 0) {
      value += propsString[i];
    }
    i++;
  }
  return {
    newIndex: i,
    value: parseObject(value)
  };
}
function parseObject(objString) {
  if (objString[0] !== '{') {
    return JSOX.parse(objString);
  }
  const result = JSOX.parse(objString.replace(/(\w+):/g, '"$1":'));
  return result;
}
function handleUnquotedString(propsString, startIndex) {
  let value = '';
  let i = startIndex;
  while (i < propsString.length && propsString[i] !== ' ') {
    value += propsString[i];
    i++;
  }
  return {
    newIndex: i - 1,
    value
  };
}
//# sourceMappingURL=extractPropsFromJSXPropsString.js.map