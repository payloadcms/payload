'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import { useTranslation } from '@payloadcms/ui';
import * as React from 'react';
export function LexicalContentEditable(t0) {
  const $ = _c(5);
  const {
    className,
    editorConfig
  } = t0;
  const {
    t
  } = useTranslation();
  const [, t1] = useLexicalComposerContext();
  const {
    getTheme
  } = t1;
  let t2;
  if ($[0] !== className || $[1] !== editorConfig?.admin?.placeholder || $[2] !== getTheme || $[3] !== t) {
    const theme = getTheme();
    t2 = _jsx(ContentEditable, {
      "aria-placeholder": t("lexical:general:placeholder"),
      className: className ?? "ContentEditable__root",
      placeholder: _jsx("p", {
        className: theme?.placeholder,
        children: editorConfig?.admin?.placeholder ?? t("lexical:general:placeholder")
      })
    });
    $[0] = className;
    $[1] = editorConfig?.admin?.placeholder;
    $[2] = getTheme;
    $[3] = t;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}
//# sourceMappingURL=ContentEditable.js.map