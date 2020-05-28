import React from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'qs';

import Page from './Page';
import Separator from './Separator';
import ClickableArrow from './ClickableArrow';

import './index.scss';

const nodeTypes = {
  Page,
  Separator,
  ClickableArrow,
};

const baseClass = 'paginator';

const Pagination = (props) => {
  const history = useHistory();
  const location = useLocation();

  const {
    totalPages,
    page: currentPage,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
    numberOfNeighbors,
  } = props;

  if (!totalPages || totalPages <= 1) return null;

  // uses react router to set the current page
  const updatePage = (page) => {
    const params = queryString.parse(location.search, { ignoreQueryPrefix: true });
    params.page = page;
    history.push({ search: queryString.stringify(params, { addQueryPrefix: true }) });
  };

  // Create array of integers for each page
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  // Assign indices for start and end of the range of pages that should be shown in paginator
  let rangeStartIndex = (currentPage - 1) - numberOfNeighbors;

  // Sanitize rangeStartIndex in case it is less than zero for safe split
  if (rangeStartIndex <= 0) rangeStartIndex = 0;

  const rangeEndIndex = (currentPage - 1) + numberOfNeighbors + 1;

  // Slice out the range of pages that we want to render
  const nodes = pages.slice(rangeStartIndex, rangeEndIndex);

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
  nodes.push({
    type: 'ClickableArrow',
    props: {
      updatePage: () => updatePage(prevPage),
      isDisabled: !hasPrevPage,
      direction: 'left',
    },
  });

  nodes.push({
    type: 'ClickableArrow',
    props: {
      updatePage: () => updatePage(nextPage),
      isDisabled: !hasNextPage,
      direction: 'right',
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

Pagination.defaultProps = {
  limit: null,
  totalPages: null,
  page: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
  numberOfNeighbors: 1,
};

Pagination.propTypes = {
  limit: PropTypes.number,
  totalPages: PropTypes.number,
  page: PropTypes.number,
  hasPrevPage: PropTypes.bool,
  hasNextPage: PropTypes.bool,
  prevPage: PropTypes.number,
  nextPage: PropTypes.number,
  numberOfNeighbors: PropTypes.number,
};
