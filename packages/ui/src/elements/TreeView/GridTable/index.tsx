import React from 'react'

import './index.scss'

const exampleColumns = [
  {
    accessor: 'name',
    gridWidth: '1fr',
    label: 'Name',
  },
  {
    accessor: 'updatedAt',
    gridWidth: 'auto',
    label: 'Updated At',
  },
]

const exampleData = [
  {
    name: 'About',
    children: [{ name: 'Team', children: [{ name: 'Member 1', docID: 3 }], docID: 2 }],
    docID: 1,
  },
  { name: 'Contact', docID: 4 },
]

export const GridTable = ({ columns = exampleColumns, data = exampleData }) => {
  return (
    <div className="grid-table-wrapper">
      <div
        className="grid-table"
        style={{
          display: 'grid',
          gridTemplateColumns: columns.map((col) => col.gridWidth || 'auto').join(' '),
        }}
      >
        <GridTableHeader columns={columns} />
        <GridTableSection columns={columns} data={data} parentDocID={null} />
      </div>
    </div>
  )
}

export const GridTableSection = ({ columns, data, level = 0, parentDocID }) => {
  return (
    <>
      {data.map((item, index) => (
        <React.Fragment key={index}>
          {/* <GridTableRow columns={columns} item={item} key={index} /> */}
          {columns.map((col, index) => (
            <React.Fragment key={index}>
              <div
                className="dnd-between dnd-between--top"
                key={index}
                style={{ gridColumn: `${index + 1} / span 1`, position: 'absolute' }}
              />
              <div>{item[col.accessor]}</div>
            </React.Fragment>
          ))}
          {/* <div className="grid-table-section" style={{ paddingLeft: level * 20 }}>
            <div className="dnd-between dnd-between--top"></div>
            <div className="dnd-between dnd-between--bottom"></div>
          </div> */}

          {item.children && item.children.length > 0 && (
            <GridTableSection
              columns={columns}
              data={item.children}
              level={level + 1}
              parentDocID={item.docID}
            />
          )}
        </React.Fragment>
      ))}
    </>
  )
}

export const GridTableRow = ({ columns, item, level = 0 }) => {
  return (
    <>
      {columns.map((col, index) => (
        <GridTableCell content={item[col.accessor]} key={index} />
      ))}
    </>
  )
}

export const GridTableCell = ({ content }) => {
  return <div className="grid-table-cell">{content || '—'}</div>
}

export const GridTableHeader = ({ columns }) => {
  return (
    <>
      {columns.map((col, index) => (
        <div className="grid-table-header-cell" key={index}>
          {col.label || col.name}
        </div>
      ))}
    </>
  )
}
