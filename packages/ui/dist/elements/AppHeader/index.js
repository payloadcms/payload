'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatAdminURL } from 'payload/shared';
import React, { useEffect, useRef, useState } from 'react';
import { Account } from '../../graphics/Account/index.js';
import { useActions } from '../../providers/Actions/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Hamburger } from '../Hamburger/index.js';
import { Link } from '../Link/index.js';
import { Localizer } from '../Localizer/index.js';
import { LocalizerLabel } from '../Localizer/LocalizerLabel/index.js';
import { useNav } from '../Nav/context.js';
import { NavToggler } from '../Nav/NavToggler/index.js';
import { RenderCustomComponent } from '../RenderCustomComponent/index.js';
import { StepNav } from '../StepNav/index.js';
import './index.scss';
const baseClass = 'app-header';
export function AppHeader({
  CustomAvatar,
  CustomIcon
}) {
  const {
    t
  } = useTranslation();
  const {
    Actions
  } = useActions();
  const {
    config: {
      admin: {
        routes: {
          account: accountRoute
        }
      },
      localization,
      routes: {
        admin: adminRoute
      },
      serverURL
    }
  } = useConfig();
  const {
    navOpen
  } = useNav();
  const customControlsRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);
  useEffect(() => {
    const checkIsScrollable = () => {
      const el = customControlsRef.current;
      if (el) {
        const scrollable = el.scrollWidth > el.clientWidth;
        setIsScrollable(scrollable);
      }
    };
    checkIsScrollable();
    window.addEventListener('resize', checkIsScrollable);
    return () => {
      window.removeEventListener('resize', checkIsScrollable);
    };
  }, [Actions]);
  const ActionComponents = Actions ? Object.values(Actions) : [];
  return /*#__PURE__*/_jsxs("header", {
    className: [baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__bg`
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__content`,
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__wrapper`,
        children: [/*#__PURE__*/_jsx(NavToggler, {
          className: `${baseClass}__mobile-nav-toggler`,
          tabIndex: -1,
          children: /*#__PURE__*/_jsx(Hamburger, {})
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__controls-wrapper`,
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__step-nav-wrapper`,
            children: /*#__PURE__*/_jsx(StepNav, {
              className: `${baseClass}__step-nav`,
              CustomIcon: CustomIcon
            })
          }), /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__actions-wrapper`,
            children: [/*#__PURE__*/_jsx("div", {
              className: `${baseClass}__actions`,
              ref: customControlsRef,
              children: ActionComponents.map((Action, i) => /*#__PURE__*/_jsx("div", {
                className: isScrollable && i === ActionComponents.length - 1 ? `${baseClass}__last-action` : '',
                children: Action
              }, i))
            }), isScrollable && /*#__PURE__*/_jsx("div", {
              className: `${baseClass}__gradient-placeholder`
            })]
          }), localization && /*#__PURE__*/_jsx(LocalizerLabel, {
            ariaLabel: "invisible",
            className: `${baseClass}__localizer-spacing`
          }), /*#__PURE__*/_jsx(Link, {
            "aria-label": t('authentication:account'),
            className: `${baseClass}__account`,
            href: formatAdminURL({
              adminRoute,
              path: accountRoute
            }),
            prefetch: false,
            tabIndex: 0,
            children: /*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: CustomAvatar,
              Fallback: /*#__PURE__*/_jsx(Account, {})
            })
          })]
        })]
      })
    }), /*#__PURE__*/_jsx(Localizer, {
      className: `${baseClass}__localizer`
    })]
  });
}
//# sourceMappingURL=index.js.map