import type { ListViewClientProps } from 'payload'

import React, { useState } from 'react'

// Import comprehensive Payload styling
import '../../../packages/ui/src/scss/styles.scss'
import '../../../packages/ui/src/views/List/index.scss'
import '../../../packages/ui/src/elements/Table/index.scss'

// Add custom styles to match real Payload interface exactly
const interactiveStyles = `
  /* Reset table styling to match Payload exactly */
  .table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    background: var(--theme-bg);
  }
  
  .table thead th {
    background: var(--theme-elevation-0);
    border-bottom: 1px solid var(--theme-elevation-150);
    padding: 16px 12px;
    text-align: left;
    font-weight: 400;
    font-size: 13px;
    color: var(--theme-elevation-600);
    border-right: none;
    border-left: none;
    border-top: none;
  }
  
  .table tbody tr {
    border-bottom: 1px solid var(--theme-elevation-100);
  }
  
  .table tbody tr:hover {
    background-color: var(--theme-elevation-50);
  }
  
  .table tbody td {
    padding: 16px 12px;
    font-size: 14px;
    color: var(--theme-text);
    border-right: none;
    border-left: none;
    border-top: none;
    vertical-align: middle;
  }
  
  .table tbody td a {
    color: var(--theme-text);
    text-decoration: none;
    font-weight: 400;
  }
  
  .table tbody td a:hover {
    text-decoration: underline;
  }
  
  /* Checkbox styling */
  .table .checkbox {
    width: 16px;
    height: 16px;
    margin: 0;
    cursor: pointer;
  }
  
  /* Sort controls styling */
  .table__sort-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .table__sort-controls {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
  }
  
  .table__sort-button {
    background: none;
    border: none;
    padding: 1px;
    cursor: pointer;
    opacity: 0.5;
  }
  
  .table__sort-button:hover {
    opacity: 1;
  }
  
  .table__sort-icon {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }
  
  /* Remove extra cell styling */
  .table__cell--select,
  .table__cell--field {
    padding: inherit;
    vertical-align: inherit;
  }
  
  /* Date/time styling */
  .table tbody td {
    white-space: nowrap;
  }
  
  /* Pagination styling */
  .collection-list__pagination {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
  }
  
  .page-controls__wrap {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .page-controls__info {
    font-size: 14px;
    color: var(--theme-elevation-600);
  }
  
  /* Search and filter toolbar styling to match real Payload */
  .list-controls {
    margin-bottom: 24px;
  }
  
  .list-controls__wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  
  .list-controls__search {
    flex: 1;
    max-width: 300px;
  }
  
  .search-filter__input {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-filter__icon {
    position: absolute;
    left: 12px;
    fill: var(--theme-elevation-400);
    z-index: 1;
  }
  
  .search-filter__input-field {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid var(--theme-elevation-150);
    border-radius: 4px;
    background: var(--theme-bg);
    font-size: 14px;
    color: var(--theme-text);
  }
  
  .search-filter__input-field::placeholder {
    color: var(--theme-elevation-400);
  }
  
  .search-filter__input-field:focus {
    outline: none;
    border-color: var(--theme-success-500);
    box-shadow: 0 0 0 1px var(--theme-success-500);
  }
  
  .list-controls__buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .list-controls__button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--theme-elevation-150);
    border-radius: 4px;
    background: var(--theme-elevation-50);
    color: var(--theme-elevation-600);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .list-controls__button:hover {
    background: var(--theme-elevation-100);
    border-color: var(--theme-elevation-200);
  }
  
  .list-controls__button svg {
    fill: currentColor;
    opacity: 0.7;
  }
  
  /* Header styling to match real Payload */
  .list-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .list-header__title {
    font-size: 32px;
    font-weight: 600;
    color: var(--theme-text);
    margin: 0;
    line-height: 1.2;
  }
  
  .list-header__create-button {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background: var(--theme-elevation-800);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  
  .list-header__create-button:hover {
    background: var(--theme-elevation-900);
  }
  
  /* Enhanced pagination styling to match real Payload exactly */
  .collection-list__pagination {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 20px 0;
    margin-top: 20px;
  }
  
  .page-controls {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .page-controls__wrap {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .page-controls__info {
    font-size: 14px;
    color: var(--theme-elevation-600);
    white-space: nowrap;
  }
  
  .page-controls .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--theme-elevation-150);
    border-radius: 4px;
    background: var(--theme-bg);
    color: var(--theme-text);
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
  }
  
  .page-controls .btn:hover {
    background: var(--theme-elevation-50);
    border-color: var(--theme-elevation-200);
  }
  
  .page-controls .btn__content {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .page-controls .btn__icon {
    width: 12px;
    height: 12px;
    fill: currentColor;
    opacity: 0.7;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = interactiveStyles
  document.head.appendChild(styleElement)
}

// Create a simplified mock ListView that demonstrates the UI structure without complex dependencies
export const MockListView: React.FC<ListViewClientProps> = ({
  AfterList,
  AfterListTable,
  BeforeList,
  BeforeListTable,
  collectionSlug,
  Description,
  hasCreatePermission,
  newDocumentURL,
  Table,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [allSelected, setAllSelected] = useState(false)

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
    setAllSelected(newSelected.size === 5) // 5 total rows
  }

  const toggleAllSelection = () => {
    if (allSelected) {
      setSelectedRows(new Set())
      setAllSelected(false)
    } else {
      setSelectedRows(new Set([0, 1, 2, 3, 4]))
      setAllSelected(true)
    }
  }
  return (
    <div className="collection-list">
      <div className="collection-list__wrap">
        <div className="list-header">
          <h1 className="list-header__title">
            {collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)}
          </h1>
          {hasCreatePermission && (
            <button className="list-header__create-button">Create New</button>
          )}
        </div>

        {Description && (
          <div className="collection-list__description">
            <Description />
          </div>
        )}

        {BeforeList}

        {/* Search and Filter Toolbar */}
        <div className="list-controls">
          <div className="list-controls__wrap">
            <div className="list-controls__search">
              <div className="search-filter">
                <div className="search-filter__input">
                  <svg className="search-filter__icon" height="16" viewBox="0 0 20 20" width="16">
                    <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                  </svg>
                  <input
                    className="search-filter__input-field"
                    placeholder="Search by Title"
                    type="text"
                  />
                </div>
              </div>
            </div>
            <div className="list-controls__buttons">
              <button className="list-controls__button">
                <span>Columns</span>
                <svg height="12" viewBox="0 0 20 20" width="12">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
              <button className="list-controls__button">
                <span>Filters</span>
                <svg height="12" viewBox="0 0 20 20" width="12">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="collection-list__content">
          {BeforeListTable}

          <div className="collection-list__tables">
            {Table ? (
              <Table />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="table__sort-column">
                        <input
                          aria-label="select-all"
                          checked={allSelected}
                          className="checkbox"
                          onChange={toggleAllSelection}
                          type="checkbox"
                        />
                      </th>
                      <th className="table__sort-column">
                        <div className="table__sort-header">
                          <span>Title</span>
                          <div className="table__sort-controls">
                            <button
                              aria-label="Sort by Title Ascending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Title ASC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                              </svg>
                            </button>
                            <button
                              aria-label="Sort by Title Descending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Title DESC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="table__sort-column">
                        <div className="table__sort-header">
                          <span>Content</span>
                          <div className="table__sort-controls">
                            <button
                              aria-label="Sort by Content Ascending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Content ASC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                              </svg>
                            </button>
                            <button
                              aria-label="Sort by Content Descending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Content DESC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="table__sort-column">
                        <div className="table__sort-header">
                          <span>Updated At</span>
                          <div className="table__sort-controls">
                            <button
                              aria-label="Sort by Updated At Ascending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Updated ASC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                              </svg>
                            </button>
                            <button
                              aria-label="Sort by Updated At Descending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Updated DESC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="table__sort-column">
                        <div className="table__sort-header">
                          <span>Created At</span>
                          <div className="table__sort-controls">
                            <button
                              aria-label="Sort by Created At Ascending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Created ASC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                              </svg>
                            </button>
                            <button
                              aria-label="Sort by Created At Descending"
                              className="table__sort-button"
                              onClick={() => console.log('Sort Created DESC')}
                            >
                              <svg className="table__sort-icon" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="table__row table__row--clickable"
                      onClick={() => console.log(`Navigate to edit post`)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--theme-elevation-50)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="table__cell table__cell--select">
                        <input
                          checked={selectedRows.has(0)}
                          className="checkbox"
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleRowSelection(0)
                          }}
                          type="checkbox"
                        />
                      </td>
                      <td className="table__cell table__cell--field">
                        <a
                          className="table__cell-link"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log(`Edit post: example post`)
                          }}
                        >
                          example post
                        </a>
                      </td>
                      <td className="table__cell table__cell--field">
                        <div className="table__cell-data">&lt;No Content&gt;</div>
                      </td>
                      <td className="table__cell table__cell--field">
                        <div className="table__cell-data">November 1st 2025, 2:36 PM</div>
                      </td>
                      <td className="table__cell table__cell--field">
                        <div className="table__cell-data">November 1st 2025, 2:36 PM</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {AfterListTable}

          <div className="collection-list__pagination">
            <div className="page-controls">
              <div className="page-controls__wrap">
                <span className="page-controls__info">1-1 of 1</span>
                <button className="btn btn--style-secondary btn--size-small btn--icon-style-with-border">
                  <span className="btn__content">
                    <span className="btn__label">Per Page: 10</span>
                    <svg className="btn__icon" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {AfterList}
    </div>
  )
}
