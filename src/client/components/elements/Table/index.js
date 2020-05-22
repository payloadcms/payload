import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'table';

const Table = ({ columns, data }) => {
  if (columns && columns.length > 0) {
    return (
      <div className={baseClass}>
        <table
          cellPadding="0"
          cellSpacing="0"
          border="0"
        >
          <thead>
            <tr>
              {columns.map((col, i) => {
                return (
                  <th key={i}>
                    {col.components.Heading}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data && data.map((row, rowIndex) => {
              return (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    return (
                      <td key={colIndex}>
                        {col.components.renderCell(row, row[col.accessor])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      accessor: PropTypes.string,
      components: PropTypes.shape({
        Heading: PropTypes.node,
        renderCell: PropTypes.function,
      }),
    }),
  ).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
};

export default Table;
