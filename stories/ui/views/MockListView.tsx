import type { ListViewClientProps } from 'payload'

import React from 'react'

// Import styling
import '../../../packages/ui/src/views/List/index.scss'
import '../../../packages/ui/src/elements/Button/index.scss'
import '../../../packages/ui/src/elements/Pill/index.scss'

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
  return (
    <div className="list-view">
      <div className="list-view__header">
        <h1 className="list-view__title">
          {collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)}
        </h1>

        {hasCreatePermission && (
          <div className="list-view__actions">
            <button
              className="btn btn--style-primary btn--icon-style-without-border btn--size-small"
              onClick={() => console.log('Create new document')}
            >
              <span className="btn__content">
                <span className="btn__label">Create New</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {Description && (
        <div className="list-view__description">
          <Description />
        </div>
      )}

      {BeforeList}

      <div className="list-view__content">
        <div className="list-view__controls">
          <div className="list-controls">
            <div className="list-controls__wrap">
              <div className="list-controls__select">
                <span className="list-selection__count">2 of 5 selected</span>
              </div>

              <div className="list-controls__buttons">
                <button className="btn btn--style-secondary btn--size-small">Edit</button>
                <button className="btn btn--style-secondary btn--size-small">Delete</button>
              </div>
            </div>
          </div>
        </div>

        {BeforeListTable}

        <div className="list-view__table">
          {Table ? (
            <Table />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table__sort-column">
                      <input className="checkbox" type="checkbox" />
                    </th>
                    <th className="table__sort-column">Title</th>
                    <th className="table__sort-column">Status</th>
                    <th className="table__sort-column">Created</th>
                    <th className="table__sort-column">Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }, (_, i) => (
                    <tr className="table__row" key={i}>
                      <td className="table__cell">
                        <input className="checkbox" type="checkbox" />
                      </td>
                      <td className="table__cell">
                        <strong>Document {i + 1}</strong>
                      </td>
                      <td className="table__cell">
                        <span className={`pill pill--style-${i % 2 === 0 ? 'success' : 'warning'}`}>
                          {i % 2 === 0 ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="table__cell">
                        {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </td>
                      <td className="table__cell">
                        {new Date(Date.now() - i * 12 * 60 * 60 * 1000).toLocaleDateString()}
                      </td>
                      <td className="table__cell">
                        <button className="btn btn--style-secondary btn--size-small">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {AfterListTable}

        <div className="list-view__pagination">
          <div className="page-controls">
            <div className="page-controls__wrap">
              <button className="btn btn--style-secondary btn--size-small" disabled>
                Previous
              </button>
              <span className="page-controls__info">Page 1 of 1 (5 Documents)</span>
              <button className="btn btn--style-secondary btn--size-small" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {AfterList}
    </div>
  )
}
