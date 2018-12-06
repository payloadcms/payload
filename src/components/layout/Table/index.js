import React from 'react';

const Table = props => {
  if (props.rows && props.rows.length) {
    return (
      <ul>
        {props.rows.map((row, i) => {
          return (
            <li key={i}>
                {row.title}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <h1>Has no rows</h1>
  )
}

export default Table;
