'use client';

import { c as _c } from "react/compiler-runtime";
import { useCallback } from 'react';
import { PUNCTUATION } from './LexicalTypeaheadMenuPlugin/index.js';
/**
 * Returns a function which checks if the trigger (e.g. '/') is present in the query and, if so, returns the matching string (text after the trigger)
 */
export function useMenuTriggerMatch(trigger, t0) {
  const $ = _c(4);
  const {
    maxLength: t1,
    minLength: t2
  } = t0;
  const maxLength = t1 === undefined ? 75 : t1;
  const minLength = t2 === undefined ? 1 : t2;
  let t3;
  if ($[0] !== maxLength || $[1] !== minLength || $[2] !== trigger) {
    t3 = t4 => {
      const {
        query
      } = t4;
      const validChars = "[^" + trigger + PUNCTUATION + "\\s]";
      const TypeaheadTriggerRegex = new RegExp("(^|\\s|\\()([" + trigger + "]" + "((?:" + validChars + "){0," + maxLength + "})" + ")$");
      const match = TypeaheadTriggerRegex.exec(query);
      if (match !== null) {
        const maybeLeadingWhitespace = match[1];
        const matchingString = match[3];
        if (matchingString.length >= minLength) {
          return {
            leadOffset: match.index + maybeLeadingWhitespace.length,
            matchingString,
            replaceableString: match[2]
          };
        }
      }
      return null;
    };
    $[0] = maxLength;
    $[1] = minLength;
    $[2] = trigger;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}
//# sourceMappingURL=useMenuTriggerMatch.js.map