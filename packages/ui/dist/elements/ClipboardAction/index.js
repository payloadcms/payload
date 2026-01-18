'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { toast } from 'sonner';
import { MoreIcon } from '../../icons/More/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Popup, PopupList } from '../Popup/index.js';
import { ClipboardActionLabel } from './ClipboardActionLabel.js';
import { clipboardCopy, clipboardPaste } from './clipboardUtilities.js';
const baseClass = 'clipboard-action';
/**
 * Menu actions for copying and pasting fields. Currently, this is only used in Arrays and Blocks.
 * @note This component doesn't use the Clipboard API, but localStorage. See rationale in #11513
 */
export const ClipboardAction = ({
  allowCopy,
  allowPaste,
  className,
  copyClassName,
  disabled,
  isRow,
  onPaste,
  pasteClassName,
  path,
  ...rest
}) => {
  const {
    t
  } = useTranslation();
  const classes = [`${baseClass}__popup`, className].filter(Boolean).join(' ');
  const handleCopy = useCallback(() => {
    const clipboardResult = clipboardCopy({
      path,
      t,
      ...rest
    });
    if (typeof clipboardResult === 'string') {
      toast.error(clipboardResult);
    } else {
      toast.success(t('general:copied'));
    }
  }, [t, rest, path]);
  const handlePaste = useCallback(() => {
    const clipboardResult_0 = clipboardPaste(rest.type === 'array' ? {
      onPaste,
      path,
      schemaFields: rest.fields,
      t
    } : {
      onPaste,
      path,
      schemaBlocks: rest.blocks,
      t
    });
    if (typeof clipboardResult_0 === 'string') {
      toast.error(clipboardResult_0);
    }
  }, [onPaste, rest, path, t]);
  if (!allowPaste && !allowCopy) {
    return null;
  }
  return /*#__PURE__*/_jsx(Popup, {
    button: /*#__PURE__*/_jsx(MoreIcon, {}),
    className: classes,
    disabled: disabled,
    horizontalAlign: "center",
    render: ({
      close
    }) => /*#__PURE__*/_jsxs(PopupList.ButtonGroup, {
      children: [/*#__PURE__*/_jsx(PopupList.Button, {
        className: copyClassName,
        disabled: !allowCopy,
        onClick: () => {
          void handleCopy();
          close();
        },
        children: /*#__PURE__*/_jsx(ClipboardActionLabel, {
          isRow: isRow
        })
      }), /*#__PURE__*/_jsx(PopupList.Button, {
        className: pasteClassName,
        disabled: !allowPaste,
        onClick: () => {
          void handlePaste();
          close();
        },
        children: /*#__PURE__*/_jsx(ClipboardActionLabel, {
          isPaste: true,
          isRow: isRow
        })
      })]
    }),
    size: "large",
    verticalAlign: "bottom"
  });
};
//# sourceMappingURL=index.js.map