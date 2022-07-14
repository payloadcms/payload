import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'table';

const Table: React.FC<Props> = ({ columns, data }) => {
  if (columns && columns.length > 0) {
    return (
      <div className={baseClass}>
        <table
          cellPadding="0"
          cellSpacing="0"
        >
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  id={`heading-${col.accessor}`}
                >
                  {col.components.Heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`row-${rowIndex + 1}`}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`cell-${col.accessor}`}
                  >
                    {col.components.renderCell(row, row[col.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};
export default Table;
