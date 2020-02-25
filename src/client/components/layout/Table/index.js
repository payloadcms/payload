import React from 'react';

import './index.scss';

const Table = (props) => {
  if (props.rows && props.rows.length) {
    return (
      <table
        border="0"
        cellPadding="0"
        cellSpacing="0"
      >
        <thead>
          <tr>
            {props.columns.map((col, i) => {
              return <th key={i}>{col.label}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, i) => {
            return (
              <tr key={i}>
                {props.columns.map((col, i) => {
                  const value = col.handler ? col.handler(row[col.key]) : row[col.key];
                  return (
                    <td key={i}>
                      {value || (
                      <span
                        className="no-data"
                        dangerouslySetInnerHTML={{ __html: '&mdash;' }}
                      />
                      )
                      }
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return null;
};

export default Table;
