'use client'

import React from 'react'

import { Section, Variant } from '../shared.js'

/**
 * Status component visual demo.
 * The actual Status component requires DocumentInfo context, so we render
 * the visual states directly for the component gallery.
 * Styles are loaded from @payloadcms/ui/elements/Status.
 */
export const StatusSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="status" selectedComponent={selectedComponent} title="Status">
    <Variant label="Draft">
      <div className="status" title="Status: Draft">
        <div className="status__value-wrap">
          <span className="status__value">Draft</span>
        </div>
      </div>
    </Variant>

    <Variant label="Published">
      <div className="status" title="Status: Published">
        <div className="status__value-wrap">
          <span className="status__value">Published</span>
        </div>
      </div>
    </Variant>

    <Variant label="Changed (with revert action)">
      <div className="status" title="Status: Changed">
        <div className="status__value-wrap">
          <span className="status__value">Changed</span>
          &nbsp;&mdash;&nbsp;
          <button className="status__action" type="button">
            Revert to Published
          </button>
        </div>
      </div>
    </Variant>

    <Variant label="Previously Published (trashed)">
      <div className="status" title="Status: Previously Published">
        <div className="status__value-wrap">
          <span className="status__value">Previously Published</span>
        </div>
      </div>
    </Variant>

    <Variant label="Previously Draft (trashed)">
      <div className="status" title="Status: Previously Draft">
        <div className="status__value-wrap">
          <span className="status__value">Previously Draft</span>
        </div>
      </div>
    </Variant>
  </Section>
)
