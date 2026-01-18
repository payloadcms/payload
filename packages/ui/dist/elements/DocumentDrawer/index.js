'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useRelatedCollections } from '../../hooks/useRelatedCollections.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Drawer, DrawerToggler } from '../Drawer/index.js';
import { DocumentDrawerContent } from './DrawerContent.js';
import './index.scss';
export const documentDrawerBaseClass = 'doc-drawer';
const formatDocumentDrawerSlug = ({
  id,
  collectionSlug,
  depth,
  uuid
}) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`;
export const DocumentDrawerToggler = t0 => {
  const $ = _c(2);
  const {
    children,
    className,
    collectionSlug,
    disabled,
    drawerSlug,
    onClick,
    operation,
    ...rest
  } = t0;
  const {
    t
  } = useTranslation();
  const [collectionConfig] = useRelatedCollections(collectionSlug);
  const t1 = t(operation === "create" ? "fields:addNewLabel" : "general:editLabel", {
    label: collectionConfig?.labels.singular
  });
  let t2;
  if ($[0] !== className) {
    t2 = [className, `${documentDrawerBaseClass}__toggler`].filter(Boolean);
    $[0] = className;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return _jsx(DrawerToggler, {
    "aria-label": t1,
    className: t2.join(" "),
    disabled,
    onClick,
    slug: drawerSlug,
    ...rest,
    children
  });
};
export const DocumentDrawer = props => {
  const {
    drawerSlug
  } = props;
  return /*#__PURE__*/_jsx(Drawer, {
    className: documentDrawerBaseClass,
    gutter: false,
    Header: null,
    slug: drawerSlug,
    children: /*#__PURE__*/_jsx(DocumentDrawerContent, {
      ...props
    })
  });
};
/**
 * A hook to manage documents from a drawer modal.
 * It provides the components and methods needed to open, close, and interact with the drawer.
 * @example
 * const [DocumentDrawer, DocumentDrawerToggler, { openDrawer, closeDrawer }] = useDocumentDrawer({
 *   collectionSlug: 'posts',
 *   id: postId, // optional, if not provided, it will render the "create new" view
 * })
 *
 * // ...
 *
 * return (
 *   <div>
 *     <DocumentDrawerToggler collectionSlug="posts" id={postId}>
 *       Edit Post
 *    </DocumentDrawerToggler>
 *    <DocumentDrawer collectionSlug="posts" id={postId} />
 *  </div>
 */
export const useDocumentDrawer = t0 => {
  const $ = _c(38);
  const {
    id,
    collectionSlug,
    overrideEntityVisibility
  } = t0;
  const editDepth = useEditDepth();
  const uuid = useId();
  const {
    closeModal,
    modalState,
    openModal,
    toggleModal
  } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  let t1;
  if ($[0] !== collectionSlug || $[1] !== editDepth || $[2] !== id || $[3] !== uuid) {
    t1 = formatDocumentDrawerSlug({
      id,
      collectionSlug,
      depth: editDepth,
      uuid
    });
    $[0] = collectionSlug;
    $[1] = editDepth;
    $[2] = id;
    $[3] = uuid;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const drawerSlug = t1;
  let t2;
  let t3;
  if ($[5] !== drawerSlug || $[6] !== modalState) {
    t2 = () => {
      setIsOpen(Boolean(modalState[drawerSlug]?.isOpen));
    };
    t3 = [modalState, drawerSlug];
    $[5] = drawerSlug;
    $[6] = modalState;
    $[7] = t2;
    $[8] = t3;
  } else {
    t2 = $[7];
    t3 = $[8];
  }
  useEffect(t2, t3);
  let t4;
  if ($[9] !== drawerSlug || $[10] !== toggleModal) {
    t4 = () => {
      toggleModal(drawerSlug);
    };
    $[9] = drawerSlug;
    $[10] = toggleModal;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  const toggleDrawer = t4;
  let t5;
  if ($[12] !== closeModal || $[13] !== drawerSlug) {
    t5 = () => {
      closeModal(drawerSlug);
    };
    $[12] = closeModal;
    $[13] = drawerSlug;
    $[14] = t5;
  } else {
    t5 = $[14];
  }
  const closeDrawer = t5;
  let t6;
  if ($[15] !== drawerSlug || $[16] !== openModal) {
    t6 = () => {
      openModal(drawerSlug);
    };
    $[15] = drawerSlug;
    $[16] = openModal;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  const openDrawer = t6;
  let t7;
  if ($[18] !== collectionSlug || $[19] !== drawerSlug || $[20] !== id || $[21] !== overrideEntityVisibility) {
    t7 = props => _createElement(DocumentDrawer, {
      ...props,
      collectionSlug,
      drawerSlug,
      id,
      key: drawerSlug,
      overrideEntityVisibility
    });
    $[18] = collectionSlug;
    $[19] = drawerSlug;
    $[20] = id;
    $[21] = overrideEntityVisibility;
    $[22] = t7;
  } else {
    t7 = $[22];
  }
  const MemoizedDrawer = t7;
  let t8;
  if ($[23] !== collectionSlug || $[24] !== drawerSlug || $[25] !== id) {
    t8 = props_0 => _jsx(DocumentDrawerToggler, {
      ...props_0,
      collectionSlug,
      drawerSlug,
      operation: !id ? "create" : "update"
    });
    $[23] = collectionSlug;
    $[24] = drawerSlug;
    $[25] = id;
    $[26] = t8;
  } else {
    t8 = $[26];
  }
  const MemoizedDrawerToggler = t8;
  let t9;
  if ($[27] !== closeDrawer || $[28] !== drawerSlug || $[29] !== editDepth || $[30] !== isOpen || $[31] !== openDrawer || $[32] !== toggleDrawer) {
    t9 = {
      closeDrawer,
      drawerDepth: editDepth,
      drawerSlug,
      isDrawerOpen: isOpen,
      openDrawer,
      toggleDrawer
    };
    $[27] = closeDrawer;
    $[28] = drawerSlug;
    $[29] = editDepth;
    $[30] = isOpen;
    $[31] = openDrawer;
    $[32] = toggleDrawer;
    $[33] = t9;
  } else {
    t9 = $[33];
  }
  const MemoizedDrawerState = t9;
  let t10;
  if ($[34] !== MemoizedDrawer || $[35] !== MemoizedDrawerState || $[36] !== MemoizedDrawerToggler) {
    t10 = [MemoizedDrawer, MemoizedDrawerToggler, MemoizedDrawerState];
    $[34] = MemoizedDrawer;
    $[35] = MemoizedDrawerState;
    $[36] = MemoizedDrawerToggler;
    $[37] = t10;
  } else {
    t10 = $[37];
  }
  return t10;
};
//# sourceMappingURL=index.js.map