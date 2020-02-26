import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import PaginationNode from './PaginationNode';
import Arrow from '../../graphics/Arrow';
import './index.scss';

const baseClass = 'pagination';

const RangeOfClickableNodes = ({
  start,
  end,
  currentPage,
  onClick,
}) => {
  const paginationNodes = Array.from({ length: (end - start + 1) }, (_, index = start) => index + start);
  return paginationNodes.map((pageNum) => {
    return (
      <PaginationNode
        key={pageNum}
        pageTo={pageNum}
        onClick={() => onClick(pageNum)}
        currentPage={currentPage}
      />
    );
  });
};

const Ellipsis = () => <span className="ellipsis">...</span>;

const Pagination = (props) => {
  const {
    totalDocs,
    limit,
    pagingCounter,
    totalPages,
    page: currentPage,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
    pageNeighbors,
    usePrevNextArrows,
    setPage,
  } = props;

  if (totalPages <= 1) return null;
  const pageBlocks = [];

  const bottomPageThreshold = 2;
  const leftEdge = currentPage - pageNeighbors;
  const leftEdgeIndex = (leftEdge - 1 > bottomPageThreshold) ? leftEdge : 1;
  const rightEdge = currentPage + pageNeighbors;
  const rightEdgeIndex = (rightEdge + 1 < totalPages - 1) ? rightEdge : totalPages;

  if (usePrevNextArrows) {
    pageBlocks.push({
      type: 'prevPage',
      start: null,
      end: null,
    });
  }

  if (leftEdgeIndex === 1 && rightEdgeIndex === totalPages) {
    // 1 2 3 [4] 5 6 7
    pageBlocks.push({
      type: 'range',
      start: leftEdgeIndex,
      end: rightEdgeIndex,
    });
  } else if (leftEdgeIndex === 1 && rightEdgeIndex !== totalPages) {
    // 1 [2] 3 4 ... 7
    pageBlocks.push({
      type: 'range',
      start: leftEdgeIndex,
      end: rightEdgeIndex,
    });
    pageBlocks.push({
      type: 'ellipsis',
      start: null,
      end: null,
    });
    pageBlocks.push({
      type: 'index',
      start: totalPages,
      end: null,
    });
  } else if (leftEdgeIndex !== 1 && rightEdgeIndex === totalPages) {
    // 1 ... 4 5 [6] 7
    pageBlocks.push({
      type: 'index',
      start: 1,
      end: null,
    });
    pageBlocks.push({
      type: 'ellipsis',
      start: null,
      end: null,
    });
    pageBlocks.push({
      type: 'range',
      start: leftEdgeIndex,
      end: rightEdgeIndex,
    });
  } else if (leftEdgeIndex !== 1 && rightEdgeIndex !== totalPages) {
    // 1 ... 4 5 [6] 7 8 ... 11
    pageBlocks.push({
      type: 'index',
      start: 1,
      end: null,
    });
    pageBlocks.push({
      type: 'ellipsis',
      start: null,
      end: null,
    });
    pageBlocks.push({
      type: 'range',
      start: leftEdgeIndex,
      end: rightEdgeIndex,
    });
    pageBlocks.push({
      type: 'ellipsis',
      start: null,
      end: null,
    });
    pageBlocks.push({
      type: 'index',
      start: totalPages,
      end: null,
    });
  }

  if (usePrevNextArrows) {
    pageBlocks.push({
      type: 'nextPage',
      start: null,
      end: null,
    });
  }

  return (
    <div className={baseClass}>
      {pageBlocks.map((pageBlock, index) => {
        switch (pageBlock.type) {
          case 'index':
            return (
              <PaginationNode
                key={index}
                pageTo={pageBlock.start}
                onClick={() => setPage(pageBlock.start)}
                currentPage={currentPage}
              />
            );

          case 'range':
            return (
              <RangeOfClickableNodes
                key={index}
                start={pageBlock.start}
                end={pageBlock.end}
                onClick={setPage}
                currentPage={currentPage}
              />
            );

          case 'ellipsis':
            return <Ellipsis />;

          case 'prevPage':
            return (
              <PaginationNode
                key={index}
                pageTo={prevPage}
                onClick={prevPage ? () => setPage(prevPage) : null}
                currentPage={currentPage}
                isDisabled={!hasPrevPage}
                className="prev"
              >
                <Arrow />
              </PaginationNode>
            );

          case 'nextPage':
            return (
              <PaginationNode
                key={index}
                pageTo={nextPage}
                onClick={nextPage ? () => setPage(nextPage) : null}
                currentPage={currentPage}
                isDisabled={!hasNextPage}
                className="next"
              >
                <Arrow />
              </PaginationNode>
            );

          default:
            return null;
        }
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
  pagingCounter: 0,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
  pageNeighbors: 1,
  usePrevNextArrows: true,
};

Pagination.propTypes = {
  totalDocs: PropTypes.number,
  limit: PropTypes.number,
  totalPages: PropTypes.number,
  page: PropTypes.number,
  pagingCounter: PropTypes.number,
  hasPrevPage: PropTypes.bool,
  hasNextPage: PropTypes.bool,
  prevPage: PropTypes.number,
  nextPage: PropTypes.number,
  pageNeighbors: PropTypes.number,
  usePrevNextArrows: PropTypes.bool,
  setPage: PropTypes.func.isRequired,
};
