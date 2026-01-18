'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { ClickableArrow } from './ClickableArrow/index.js';
import './index.scss';
import { Page } from './Page/index.js';
import { Separator } from './Separator/index.js';
const nodeTypes = {
  ClickableArrow,
  Page,
  Separator
};
const baseClass = 'paginator';
export const Pagination = props => {
  const {
    hasNextPage = false,
    hasPrevPage = false,
    nextPage = null,
    numberOfNeighbors = 1,
    onChange,
    page: currentPage,
    prevPage = null,
    totalPages = null
  } = props;
  if (!hasPrevPage && !hasNextPage) {
    return null;
  }
  const updatePage = page => {
    if (typeof onChange === 'function') {
      onChange(page);
    }
  };
  // Create array of integers for each page
  const pages = Array.from({
    length: totalPages
  }, (_, index) => index + 1);
  // Assign indices for start and end of the range of pages that should be shown in paginator
  let rangeStartIndex = currentPage - 1 - numberOfNeighbors;
  // Sanitize rangeStartIndex in case it is less than zero for safe split
  if (rangeStartIndex <= 0) {
    rangeStartIndex = 0;
  }
  const rangeEndIndex = currentPage - 1 + numberOfNeighbors + 1;
  // Slice out the range of pages that we want to render
  const nodes = pages.slice(rangeStartIndex, rangeEndIndex);
  // Add prev separator if necessary
  if (currentPage - numberOfNeighbors - 1 >= 2) {
    nodes.unshift({
      type: 'Separator'
    });
  }
  // Add first page if necessary
  if (currentPage > numberOfNeighbors + 1) {
    nodes.unshift({
      type: 'Page',
      props: {
        isFirstPage: true,
        page: 1,
        updatePage
      }
    });
  }
  // Add next separator if necessary
  if (currentPage + numberOfNeighbors + 1 < totalPages) {
    nodes.push({
      type: 'Separator'
    });
  }
  // Add last page if necessary
  if (rangeEndIndex < totalPages) {
    nodes.push({
      type: 'Page',
      props: {
        isLastPage: true,
        page: totalPages,
        updatePage
      }
    });
  }
  // Add prev and next arrows based on necessity
  nodes.unshift({
    type: 'ClickableArrow',
    props: {
      direction: 'right',
      isDisabled: !hasNextPage,
      updatePage: () => updatePage(nextPage ?? currentPage + 1)
    }
  });
  nodes.unshift({
    type: 'ClickableArrow',
    props: {
      direction: 'left',
      isDisabled: !hasPrevPage,
      updatePage: () => updatePage(prevPage ?? Math.max(1, currentPage - 1))
    }
  });
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: nodes.map((node, i) => {
      if (typeof node === 'number') {
        return /*#__PURE__*/_jsx(Page, {
          isCurrent: currentPage === node,
          page: node,
          updatePage: updatePage
        }, i);
      }
      const NodeType = nodeTypes[node.type];
      return /*#__PURE__*/_jsx(NodeType, {
        ...node.props
      }, i);
    })
  });
};
//# sourceMappingURL=index.js.map