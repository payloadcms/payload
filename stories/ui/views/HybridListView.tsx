import type { ListViewClientProps } from 'payload'

import React from 'react'

// Import only the basic Payload components that work without complex contexts
import { Button, Gutter, Pill } from '@payloadcms/ui'

// Import comprehensive Payload styling - NO CUSTOM CSS
import '../../../packages/ui/src/scss/styles.scss'
import '../../../packages/ui/src/views/List/index.scss'
import '../../../packages/ui/src/elements/ListHeader/index.scss'
import '../../../packages/ui/src/elements/ListControls/index.scss'
import '../../../packages/ui/src/elements/SearchBar/index.scss'

const baseClass = 'collection-list'
const listHeaderClass = 'list-header'

// Create a ListView that uses Payload's exact HTML structure and CSS classes
export const HybridListView: React.FC<ListViewClientProps> = ({
  AfterList,
  AfterListTable,
  BeforeList,
  BeforeListTable,
  collectionSlug,
  Description,
  hasCreatePermission,
  newDocumentURL,
  Table: TableComponent,
}) => {
  const collectionTitle = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)

  return (
    <div className={`${baseClass} ${baseClass}--${collectionSlug}`}>
      {BeforeList}
      <Gutter className={`${baseClass}__wrap`}>
        {/* Recreate ListHeader structure exactly as Payload does */}
        <header className={listHeaderClass}>
          <div className={`${listHeaderClass}__content`}>
            <div className={`${listHeaderClass}__title-and-actions`}>
              <h1 className={`${listHeaderClass}__title`}>{collectionTitle}</h1>
              {hasCreatePermission && (
                <div className={`${listHeaderClass}__title-actions`}>
                  <Button buttonStyle="primary" el="link" size="small" to={newDocumentURL}>
                    Create New
                  </Button>
                </div>
              )}
            </div>
          </div>
          {Description && (
            <div className={`${listHeaderClass}__after-header-content`}>
              <Description />
            </div>
          )}
        </header>

        {/* Recreate ListControls structure exactly as Payload does */}
        <div className="list-controls">
          <div className="search-bar">
            <div className="search-bar__wrap">
              <div className="search-bar__input">
                <div className="search-bar__icon">
                  <svg viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
                    <path d="m20.67 18.17-5.3-5.3a6.5 6.5 0 1 0-2.5 2.5l5.3 5.3a1.75 1.75 0 1 0 2.5-2.5ZM6.5 11a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
                  </svg>
                </div>
                <input
                  className="search-bar__input-field"
                  placeholder="Search by Title"
                  type="text"
                />
              </div>
              <div className="search-bar__actions">
                <Pill
                  icon={
                    <svg className="pill__icon" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  }
                  onClick={() => console.log('Columns clicked')}
                  pillStyle="light"
                  size="small"
                >
                  Columns
                </Pill>
                <Pill
                  icon={
                    <svg className="pill__icon" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  }
                  onClick={() => console.log('Filters clicked')}
                  pillStyle="light"
                  size="small"
                >
                  Filters
                </Pill>
              </div>
            </div>
          </div>
        </div>

        {BeforeListTable}

        {/* Table section with authentic Payload structure */}
        <div className={`${baseClass}__tables`}>
          {TableComponent ? (
            <TableComponent />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__sort-column">
                      <input aria-label="select-all" className="checkbox" type="checkbox" />
                    </th>
                    <th className="table__sort-column">
                      <div className="table__sort-header">
                        <span>Title</span>
                        <div className="table__sort-controls">
                          <button
                            aria-label="Sort by Title Ascending"
                            className="table__sort-button"
                          >
                            <svg className="table__sort-icon" viewBox="0 0 20 20">
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Sort by Title Descending"
                            className="table__sort-button"
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
                          >
                            <svg className="table__sort-icon" viewBox="0 0 20 20">
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Sort by Content Descending"
                            className="table__sort-button"
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
                          >
                            <svg className="table__sort-icon" viewBox="0 0 20 20">
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Sort by Updated At Descending"
                            className="table__sort-button"
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
                          >
                            <svg className="table__sort-icon" viewBox="0 0 20 20">
                              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                            </svg>
                          </button>
                          <button
                            aria-label="Sort by Created At Descending"
                            className="table__sort-button"
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
                  <tr className="table__row">
                    <td className="table__cell">
                      <input className="checkbox" type="checkbox" />
                    </td>
                    <td className="table__cell">
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        example post
                      </a>
                    </td>
                    <td className="table__cell">&lt;No Content&gt;</td>
                    <td className="table__cell">November 1st 2025, 2:36 PM</td>
                    <td className="table__cell">November 1st 2025, 2:36 PM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {AfterListTable}

        {/* Pagination with authentic Payload structure */}
        <div className="page-controls">
          <div className="page-controls__wrap">
            <span className="page-controls__info">1-1 of 1</span>
            <Button
              buttonStyle="secondary"
              icon={
                <svg viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              }
              iconStyle="with-border"
              size="small"
            >
              Per Page: 10
            </Button>
          </div>
        </div>
      </Gutter>
      {AfterList}
    </div>
  )
}
