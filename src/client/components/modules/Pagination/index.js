import React from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'qs';

import Page from './Page';
import Ellipsis from './Ellipsis';
import NextArrow from './NextArrow';
import PrevArrow from './PrevArrow';

import './index.scss';

const nodeTypes = {
  Page,
  Ellipsis,
  NextArrow,
  PrevArrow,
};

const baseClass = 'pagination';

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

  const updatePage = (page) => {
    const params = queryString.parse(location.search, { ignoreQueryPrefix: true });
    params.page = page;
    history.push({ search: queryString.stringify(params, { addQueryPrefix: true }) });
  };

  if (totalPages <= 1) return null;

  // Create array of integers for each page
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  // Assign indices for start and end of the range of pages that should be shown in paginator
  let rangeStartIndex = (currentPage - 1) - numberOfNeighbors;

  // Sanitize rangeStartIndex in case it is less than zero for safe split
  if (rangeStartIndex <= 0) rangeStartIndex = 0;

  const rangeEndIndex = (currentPage - 1) + numberOfNeighbors + 1;

  // Slice out the range of pages that we want to render
  const nodes = pages.slice(rangeStartIndex, rangeEndIndex);

  // Add prev ellipsis and first page if necessary
  if (currentPage > numberOfNeighbors + 1) {
    nodes.unshift({ type: 'Ellipsis' });
    nodes.unshift({
      type: 'Page',
      props: {
        page: 1,
        updatePage,
      },
    });
  }

  // Add next ellipsis and total page if necessary
  if (rangeEndIndex < totalPages) {
    nodes.push({ type: 'Ellipsis' });
    nodes.push({
      type: 'Page',
      props: {
        page: totalPages,
        updatePage,
      },
    });
  }

  // Add prev and next arrows based on need
  if (hasPrevPage) {
    nodes.unshift({
      type: 'PrevArrow',
      props: {
        updatePage: () => updatePage(prevPage),
      },
    });
  }

  if (hasNextPage) {
    nodes.push({
      type: 'NextArrow',
      props: {
        updatePage: () => updatePage(nextPage),
      },
    });
  }

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
  totalDocs: null,
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
  totalDocs: PropTypes.number,
  limit: PropTypes.number,
  totalPages: PropTypes.number,
  page: PropTypes.number,
  hasPrevPage: PropTypes.bool,
  hasNextPage: PropTypes.bool,
  prevPage: PropTypes.number,
  nextPage: PropTypes.number,
  numberOfNeighbors: PropTypes.number,
};
