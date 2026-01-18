'use client';

import { c as _c } from "react/compiler-runtime";
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js';
import { useAllFormFields, useFormSubmitted } from '../Form/context.js';
import { buildPathSegments } from './buildPathSegments.js';
export const WatchChildErrors = t0 => {
  const $ = _c(12);
  const {
    fields,
    path: parentPath,
    setErrorCount
  } = t0;
  const [formState] = useAllFormFields();
  const hasSubmitted = useFormSubmitted();
  let t1;
  if ($[0] !== fields) {
    t1 = buildPathSegments(fields);
    $[0] = fields;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const segmentsToMatch = t1;
  let t2;
  if ($[2] !== formState || $[3] !== hasSubmitted || $[4] !== parentPath || $[5] !== segmentsToMatch || $[6] !== setErrorCount) {
    t2 = () => {
      if (hasSubmitted) {
        let errorCount = 0;
        Object.entries(formState).forEach(t3 => {
          const [key] = t3;
          const matchingSegment = segmentsToMatch?.some(segment => {
            const segmentToMatch = [...parentPath, segment].join(".");
            if (segmentToMatch.endsWith(".")) {
              return key.startsWith(segmentToMatch);
            }
            return key === segmentToMatch;
          });
          if (matchingSegment) {
            const pathState = formState[key];
            if ("valid" in pathState && !pathState.valid) {
              errorCount = errorCount + 1;
              errorCount;
            }
          }
        });
        setErrorCount(errorCount);
      }
    };
    $[2] = formState;
    $[3] = hasSubmitted;
    $[4] = parentPath;
    $[5] = segmentsToMatch;
    $[6] = setErrorCount;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  let t3;
  if ($[8] !== fields || $[9] !== formState || $[10] !== hasSubmitted) {
    t3 = [formState, hasSubmitted, fields];
    $[8] = fields;
    $[9] = formState;
    $[10] = hasSubmitted;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  useThrottledEffect(t2, 250, t3);
  return null;
};
//# sourceMappingURL=index.js.map