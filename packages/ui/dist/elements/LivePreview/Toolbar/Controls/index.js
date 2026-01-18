'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronIcon } from '../../../../icons/Chevron/index.js';
import { ExternalLinkIcon } from '../../../../icons/ExternalLink/index.js';
import { XIcon } from '../../../../icons/X/index.js';
import { useLivePreviewContext } from '../../../../providers/LivePreview/context.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { Popup, PopupList } from '../../../Popup/index.js';
import { PreviewFrameSizeInput } from '../SizeInput/index.js';
import './index.scss';
const baseClass = 'live-preview-toolbar-controls';
const zoomOptions = [50, 75, 100, 125, 150, 200];
export const ToolbarControls = () => {
  const $ = _c(14);
  const {
    breakpoint,
    breakpoints,
    setBreakpoint,
    setPreviewWindowType,
    setZoom,
    url,
    zoom
  } = useLivePreviewContext();
  const {
    t
  } = useTranslation();
  let t0;
  if ($[0] !== breakpoint || $[1] !== breakpoints || $[2] !== setBreakpoint || $[3] !== setPreviewWindowType || $[4] !== setZoom || $[5] !== t || $[6] !== url || $[7] !== zoom) {
    const customOption = {
      label: t("general:custom"),
      value: "custom"
    };
    let t2;
    if ($[9] !== setZoom || $[10] !== zoom) {
      t2 = t3 => {
        const {
          close: close_0
        } = t3;
        return _jsx(PopupList.ButtonGroup, {
          children: _jsx(React.Fragment, {
            children: zoomOptions.map(zoomValue => _jsxs(PopupList.Button, {
              active: zoom * 100 == zoomValue,
              onClick: () => {
                setZoom(zoomValue / 100);
                close_0();
              },
              children: [zoomValue, "%"]
            }, zoomValue))
          })
        });
      };
      $[9] = setZoom;
      $[10] = zoom;
      $[11] = t2;
    } else {
      t2 = $[11];
    }
    let t3;
    if ($[12] !== setPreviewWindowType) {
      t3 = e => {
        e.preventDefault();
        setPreviewWindowType("popup");
      };
      $[12] = setPreviewWindowType;
      $[13] = t3;
    } else {
      t3 = $[13];
    }
    t0 = _jsxs("div", {
      className: baseClass,
      children: [breakpoints?.length > 0 && _jsx(Popup, {
        button: _jsxs(React.Fragment, {
          children: [_jsx("span", {
            children: breakpoints.find(bp => bp.name == breakpoint)?.label ?? customOption.label
          }), _jsx(ChevronIcon, {
            className: `${baseClass}__chevron`
          })]
        }),
        className: `${baseClass}__breakpoint`,
        horizontalAlign: "right",
        render: t1 => {
          const {
            close
          } = t1;
          return _jsx(PopupList.ButtonGroup, {
            children: _jsxs(React.Fragment, {
              children: [breakpoints.map(bp_0 => _jsx(PopupList.Button, {
                active: bp_0.name == breakpoint,
                onClick: () => {
                  setBreakpoint(bp_0.name);
                  close();
                },
                children: bp_0.label
              }, bp_0.name)), breakpoint === "custom" && _jsx(PopupList.Button, {
                active: breakpoint == customOption.value,
                onClick: () => {
                  setBreakpoint(customOption.value);
                  close();
                },
                children: customOption.label
              })]
            })
          });
        },
        showScrollbar: true,
        verticalAlign: "bottom"
      }), _jsxs("div", {
        className: `${baseClass}__device-size`,
        children: [_jsx(PreviewFrameSizeInput, {
          axis: "x"
        }), _jsx("span", {
          className: `${baseClass}__size-divider`,
          children: _jsx(XIcon, {})
        }), _jsx(PreviewFrameSizeInput, {
          axis: "y"
        })]
      }), _jsx(Popup, {
        button: _jsxs(React.Fragment, {
          children: [_jsxs("span", {
            children: [zoom * 100, "%"]
          }), _jsx(ChevronIcon, {
            className: `${baseClass}__chevron`
          })]
        }),
        className: `${baseClass}__zoom`,
        horizontalAlign: "right",
        render: t2,
        showScrollbar: true,
        verticalAlign: "bottom"
      }), _jsx("a", {
        className: `${baseClass}__external`,
        href: url,
        onClick: t3,
        target: "_blank",
        title: "Open in new window",
        type: "button",
        children: _jsx(ExternalLinkIcon, {})
      })]
    });
    $[0] = breakpoint;
    $[1] = breakpoints;
    $[2] = setBreakpoint;
    $[3] = setPreviewWindowType;
    $[4] = setZoom;
    $[5] = t;
    $[6] = url;
    $[7] = zoom;
    $[8] = t0;
  } else {
    t0 = $[8];
  }
  return t0;
};
//# sourceMappingURL=index.js.map