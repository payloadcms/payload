'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { hasAutosaveEnabled } from 'payload/shared';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useRelatedCollections } from '../../hooks/useRelatedCollections.js';
import { PlusIcon } from '../../icons/Plus/index.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { useDocumentDrawer } from '../DocumentDrawer/index.js';
import { Popup } from '../Popup/index.js';
import * as PopupList from '../Popup/PopupButtonList/index.js';
import './index.scss';
import { Tooltip } from '../Tooltip/index.js';
const baseClass = 'relationship-add-new';
export const AddNewRelation = t0 => {
  const $ = _c(46);
  const {
    Button: ButtonFromProps,
    hasMany,
    onChange,
    path,
    relationTo,
    unstyled,
    value
  } = t0;
  const relatedCollections = useRelatedCollections(relationTo);
  const {
    permissions
  } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState();
  const relatedToMany = relatedCollections.length > 1;
  let t1;
  if ($[0] !== relatedCollections[0] || $[1] !== relatedToMany) {
    t1 = () => !relatedToMany ? relatedCollections[0] : undefined;
    $[0] = relatedCollections[0];
    $[1] = relatedToMany;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const [collectionConfig, setCollectionConfig] = useState(t1);
  const [popupOpen, setPopupOpen] = useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const t2 = collectionConfig?.slug;
  let t3;
  if ($[3] !== t2) {
    t3 = {
      collectionSlug: t2
    };
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const [DocumentDrawer, DocumentDrawerToggler, t4] = useDocumentDrawer(t3);
  const {
    isDrawerOpen,
    toggleDrawer
  } = t4;
  let t5;
  if ($[5] !== collectionConfig || $[6] !== hasMany || $[7] !== onChange || $[8] !== value) {
    t5 = t6 => {
      const {
        doc,
        operation
      } = t6;
      if (operation === "create" || operation === "update" && hasAutosaveEnabled(collectionConfig)) {
        let isNewValue;
        if (!value) {
          isNewValue = true;
        } else {
          isNewValue = Array.isArray(value) ? !value.some(v => v && v.value === doc.id) : value.value !== doc.id;
        }
        if (isNewValue) {
          if (hasMany === true) {
            onChange([...(Array.isArray(value) ? value : []), {
              relationTo: collectionConfig?.slug,
              value: doc.id
            }]);
          } else {
            onChange({
              relationTo: collectionConfig?.slug,
              value: doc.id
            });
          }
        }
        setSelectedCollection(undefined);
      }
    };
    $[5] = collectionConfig;
    $[6] = hasMany;
    $[7] = onChange;
    $[8] = value;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  const onSave = t5;
  let t6;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t6 = state => {
      setPopupOpen(state);
    };
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  const onPopupToggle = t6;
  let t7;
  let t8;
  if ($[11] !== permissions || $[12] !== relatedCollections) {
    t7 = () => {
      if (permissions) {
        if (relatedCollections.length === 1) {
          setShow(permissions.collections[relatedCollections[0]?.slug]?.create);
        } else {
          setShow(relatedCollections.some(collection => permissions.collections[collection?.slug]?.create));
        }
      }
    };
    t8 = [permissions, relatedCollections];
    $[11] = permissions;
    $[12] = relatedCollections;
    $[13] = t7;
    $[14] = t8;
  } else {
    t7 = $[13];
    t8 = $[14];
  }
  useEffect(t7, t8);
  let t10;
  let t9;
  if ($[15] !== relatedCollections || $[16] !== relatedToMany || $[17] !== selectedCollection) {
    t9 = () => {
      if (relatedToMany && selectedCollection) {
        setCollectionConfig(relatedCollections.find(collection_0 => collection_0?.slug === selectedCollection));
      }
    };
    t10 = [selectedCollection, relatedToMany, relatedCollections];
    $[15] = relatedCollections;
    $[16] = relatedToMany;
    $[17] = selectedCollection;
    $[18] = t10;
    $[19] = t9;
  } else {
    t10 = $[18];
    t9 = $[19];
  }
  useEffect(t9, t10);
  let t11;
  let t12;
  if ($[20] !== collectionConfig || $[21] !== relatedToMany || $[22] !== toggleDrawer) {
    t11 = () => {
      if (relatedToMany && collectionConfig) {
        toggleDrawer();
        setSelectedCollection(undefined);
      }
    };
    t12 = [toggleDrawer, relatedToMany, collectionConfig];
    $[20] = collectionConfig;
    $[21] = relatedToMany;
    $[22] = toggleDrawer;
    $[23] = t11;
    $[24] = t12;
  } else {
    t11 = $[23];
    t12 = $[24];
  }
  useEffect(t11, t12);
  let t13;
  let t14;
  if ($[25] !== isDrawerOpen || $[26] !== relatedToMany) {
    t13 = () => {
      if (relatedToMany && !isDrawerOpen) {
        setCollectionConfig(undefined);
      }
    };
    t14 = [isDrawerOpen, relatedToMany];
    $[25] = isDrawerOpen;
    $[26] = relatedToMany;
    $[27] = t13;
    $[28] = t14;
  } else {
    t13 = $[27];
    t14 = $[28];
  }
  useEffect(t13, t14);
  const t15 = relatedCollections[0]?.labels.singular;
  let t16;
  let t17;
  if ($[29] !== ButtonFromProps || $[30] !== DocumentDrawer || $[31] !== DocumentDrawerToggler || $[32] !== collectionConfig || $[33] !== i18n || $[34] !== onSave || $[35] !== path || $[36] !== permissions || $[37] !== popupOpen || $[38] !== relatedCollections || $[39] !== show || $[40] !== showTooltip || $[41] !== t || $[42] !== t15 || $[43] !== unstyled) {
    t17 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const label = t("fields:addNewLabel", {
        label: getTranslation(t15, i18n)
      });
      if (!show) {
        t17 = null;
        break bb0;
      }
      t16 = _jsxs("div", {
        className: baseClass,
        id: `${path}-add-new`,
        children: [relatedCollections.length === 1 && _jsxs(Fragment, {
          children: [_jsx(DocumentDrawerToggler, {
            className: [`${baseClass}__add-button`, unstyled && `${baseClass}__add-button--unstyled`].filter(Boolean).join(" "),
            onClick: () => {
              setShowTooltip(false);
            },
            onMouseEnter: () => setShowTooltip(true),
            onMouseLeave: () => setShowTooltip(false),
            children: ButtonFromProps ? ButtonFromProps : _jsxs(Fragment, {
              children: [_jsx(Tooltip, {
                className: `${baseClass}__tooltip`,
                show: showTooltip,
                children: label
              }), _jsx(PlusIcon, {})]
            })
          }), _jsx(DocumentDrawer, {
            onSave
          })]
        }), relatedCollections.length > 1 && _jsxs(Fragment, {
          children: [_jsx(Popup, {
            button: ButtonFromProps ? ButtonFromProps : _jsx(Button, {
              buttonStyle: "none",
              className: `${baseClass}__add-button`,
              tooltip: popupOpen ? undefined : t("fields:addNew"),
              children: _jsx(PlusIcon, {})
            }),
            buttonType: "custom",
            horizontalAlign: "center",
            onToggleOpen: onPopupToggle,
            render: t18 => {
              const {
                close: closePopup
              } = t18;
              return _jsx(PopupList.ButtonGroup, {
                children: relatedCollections.map(relatedCollection => {
                  if (permissions.collections[relatedCollection?.slug]?.create) {
                    return _jsx(PopupList.Button, {
                      className: `${baseClass}__relation-button--${relatedCollection?.slug}`,
                      onClick: () => {
                        closePopup();
                        setSelectedCollection(relatedCollection?.slug);
                      },
                      children: getTranslation(relatedCollection?.labels?.singular, i18n)
                    }, relatedCollection?.slug);
                  }
                  return null;
                })
              });
            },
            size: "medium"
          }), collectionConfig && permissions.collections[collectionConfig?.slug]?.create && _jsx(DocumentDrawer, {
            onSave
          })]
        })]
      });
    }
    $[29] = ButtonFromProps;
    $[30] = DocumentDrawer;
    $[31] = DocumentDrawerToggler;
    $[32] = collectionConfig;
    $[33] = i18n;
    $[34] = onSave;
    $[35] = path;
    $[36] = permissions;
    $[37] = popupOpen;
    $[38] = relatedCollections;
    $[39] = show;
    $[40] = showTooltip;
    $[41] = t;
    $[42] = t15;
    $[43] = unstyled;
    $[44] = t16;
    $[45] = t17;
  } else {
    t16 = $[44];
    t17 = $[45];
  }
  if (t17 !== Symbol.for("react.early_return_sentinel")) {
    return t17;
  }
  return t16;
};
//# sourceMappingURL=index.js.map