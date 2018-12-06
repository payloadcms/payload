import React from 'react';

import './index.scss';

const Table = props => {
  if (props.rows && props.rows.length) {
    return (
      <table border="0" cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            {props.columns.map((col, i) => {
              return <th key={i}>{col.label}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, i) => {
            return (
              <tr key={i}>
                  {props.columns.map((col, i) => {
                    return (
                      <td key={i}>
                        {row[col.key] ? row[col.key] : <span className="no-data" dangerouslySetInnerHTML={{__html: '&mdash;'}} />}
                      </td>
                    )
                  })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <h1>Has no rows</h1>
  )
}

export default Table;
