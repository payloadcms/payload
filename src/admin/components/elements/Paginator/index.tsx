import React from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { Props, Node } from './types';

import Page from './Page';
import Separator from './Separator';
import ClickableArrow from './ClickableArrow';
import { useSearchParams } from '../../utilities/SearchParams';

import './index.scss';

const nodeTypes = {
  Page,
  Separator,
  ClickableArrow,
};

const baseClass = 'paginator';

const Pagination: React.FC<Props> = (props) => {
  const history = useHistory();
  const params = useSearchParams();

  const {
    totalPages = null,
    page: currentPage,
    hasPrevPage = false,
    hasNextPage = false,
    prevPage = null,
    nextPage = null,
    numberOfNeighbors = 1,
    disableHistoryChange = false,
    onChange,
  } = props;

  if (!totalPages || totalPages <= 1) return null;

  // uses react router to set the current page
  const updatePage = (page) => {
    if (!disableHistoryChange) {
      const newParams = {
        ...params,
      };

      newParams.page = page;
      history.push({ search: queryString.stringify(newParams, { addQueryPrefix: true }) });
    }

    if (typeof onChange === 'function') onChange(page);
  };

  // Create array of integers for each page
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  // Assign indices for start and end of the range of pages that should be shown in paginator
  let rangeStartIndex = (currentPage - 1) - numberOfNeighbors;

  // Sanitize rangeStartIndex in case it is less than zero for safe split
  if (rangeStartIndex <= 0) rangeStartIndex = 0;

  const rangeEndIndex = (currentPage - 1) + numberOfNeighbors + 1;

  // Slice out the range of pages that we want to render
  const nodes: Node[] = pages.slice(rangeStartIndex, rangeEndIndex);

  // Add prev separator if necessary
  if (currentPage - numberOfNeighbors - 1 >= 2) nodes.unshift({ type: 'Separator' });
  // Add first page if necessary
  if (currentPage > numberOfNeighbors + 1) {
    nodes.unshift({
      type: 'Page',
      props: {
        page: 1,
        updatePage,
        isFirstPage: true,
      },
    });
  }

  // Add next separator if necessary
  if (currentPage + numberOfNeighbors + 1 < totalPages) nodes.push({ type: 'Separator' });
  // Add last page if necessary
  if (rangeEndIndex < totalPages) {
    nodes.push({
      type: 'Page',
      props: {
        page: totalPages,
        updatePage,
        isLastPage: true,
      },
    });
  }

  // Add prev and next arrows based on necessity
  nodes.unshift({
    type: 'ClickableArrow',
    props: {
      updatePage: () => updatePage(nextPage),
      isDisabled: !hasNextPage,
      direction: 'right',
    },
  });

  nodes.unshift({
    type: 'ClickableArrow',
    props: {
      updatePage: () => updatePage(prevPage),
      isDisabled: !hasPrevPage,
      direction: 'left',
    },
  });

  return (
    <div className={baseClass}>
      {nodes.map((node, i) => {
        if (typeof node === 'number') {
          return (
            <Page
              key={i}
              page={node}
              updatePage={updatePage}
              isCurrent={currentPage === node}
            />
          );
        }

        const NodeType = nodeTypes[node.type];

        return (
          <NodeType
            key={i}
            {...node.props}
          />
        );
      })}
    </div>
  );
};

export default Pagination;
