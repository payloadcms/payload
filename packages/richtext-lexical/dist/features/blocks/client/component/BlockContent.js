'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { RenderFields, useFormSubmitted } from '@payloadcms/ui';
import React, { createContext, useMemo } from 'react';
const BlockComponentContext = /*#__PURE__*/createContext({
  baseClass: 'LexicalEditorTheme__block',
  BlockCollapsible: () => null,
  BlockDrawer: () => null,
  CustomBlock: null,
  EditButton: () => null,
  errorCount: 0,
  formSchema: [],
  initialState: false,
  nodeKey: '',
  RemoveButton: () => null
});
export const useBlockComponentContext = () => React.use(BlockComponentContext);
/**
 * The actual content of the Block. This should be INSIDE a Form component,
 * scoped to the block. All format operations in here are thus scoped to the block's form, and
 * not the whole document.
 */
export const BlockContent = props => {
  const $ = _c(4);
  const {
    Collapsible,
    ...contextProps
  } = props;
  const {
    BlockDrawer,
    CustomBlock,
    errorCount,
    formSchema
  } = contextProps;
  const hasSubmitted = useFormSubmitted();
  const fieldHasErrors = hasSubmitted && errorCount > 0;
  const isEditable = useLexicalEditable();
  let t0;
  if ($[0] !== Collapsible || $[1] !== errorCount || $[2] !== fieldHasErrors) {
    t0 = props_0 => {
      const {
        children,
        ...rest
      } = props_0;
      return _jsx(Collapsible, {
        errorCount,
        fieldHasErrors,
        ...rest,
        children
      });
    };
    $[0] = Collapsible;
    $[1] = errorCount;
    $[2] = fieldHasErrors;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const CollapsibleWithErrorProps = t0;
  return CustomBlock ? _jsxs(BlockComponentContext, {
    value: {
      ...contextProps,
      BlockCollapsible: CollapsibleWithErrorProps
    },
    children: [CustomBlock, _jsx(BlockDrawer, {})]
  }) : _jsx(CollapsibleWithErrorProps, {
    children: _jsx(RenderFields, {
      fields: formSchema,
      forceRender: true,
      parentIndexPath: "",
      parentPath: "",
      parentSchemaPath: "",
      permissions: true,
      readOnly: !isEditable
    })
  });
};
//# sourceMappingURL=BlockContent.js.map