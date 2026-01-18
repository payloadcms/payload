"use client";
// Workaround for react-datepicker and other cjs dependencies potentially inserting require("react") statements
import * as requireReact from 'react';
import * as requireReactDom from 'react-dom';

function require(m) {
 if (m === 'react') return requireReact;
 if (m === 'react-dom') return requireReactDom;
 throw new Error(`Unknown module ${m}`);
}
// Workaround end

import{n as a}from"./chunk-DSPGX6EY.js";import"./chunk-5LKBKI4T.js";export{a as default};
//# sourceMappingURL=DatePicker-CGU25CJE.js.map
