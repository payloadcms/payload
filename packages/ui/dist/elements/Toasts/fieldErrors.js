'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
function groupSimilarErrors(items) {
  const result = [];
  for (const item of items) {
    if (item) {
      const parts = item.split(' → ');
      let inserted = false;
      // Find a place where a similar path exists
      for (let i = 0; i < result.length; i++) {
        if (result[i].startsWith(parts[0])) {
          result.splice(i + 1, 0, item);
          inserted = true;
          break;
        }
      }
      // If no similar path was found, add to the end
      if (!inserted) {
        result.push(item);
      }
    }
  }
  return result;
}
function createErrorsFromMessage(message) {
  const [intro, errorsString] = message.split(':');
  if (!errorsString) {
    return {
      message: intro
    };
  }
  const errors = errorsString.split(',').map(error => error.replaceAll(' > ', ' → ').trim());
  if (errors.length === 1) {
    return {
      errors,
      message: `${intro}: `
    };
  }
  return {
    errors: groupSimilarErrors(errors),
    message: `${intro} (${errors.length}):`
  };
}
export function FieldErrorsToast(t0) {
  const $ = _c(5);
  const {
    errorMessage
  } = t0;
  let t1;
  if ($[0] !== errorMessage) {
    t1 = () => createErrorsFromMessage(errorMessage);
    $[0] = errorMessage;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [t2] = React.useState(t1);
  const {
    errors,
    message
  } = t2;
  let t3;
  if ($[2] !== errors || $[3] !== message) {
    t3 = _jsxs("div", {
      children: [message, Array.isArray(errors) && errors.length > 0 ? errors.length === 1 ? _jsx("span", {
        "data-testid": "field-error",
        children: errors[0]
      }) : _jsx("ul", {
        "data-testid": "field-errors",
        children: errors.map(_temp)
      }) : null]
    });
    $[2] = errors;
    $[3] = message;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function _temp(error, index) {
  return _jsx("li", {
    children: error
  }, index);
}
//# sourceMappingURL=fieldErrors.js.map