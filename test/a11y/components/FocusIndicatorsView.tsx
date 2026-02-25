'use client'

import { Button } from '@payloadcms/ui'
import React from 'react'

import './styles.css'

export const FocusIndicatorsView = () => {
  return (
    <div className="focus-indicators-test-page">
      <h1>Focus Indicators Test Page</h1>
      <p>This page tests various interactive elements with different focus indicator states.</p>

      {/* Section 1: Good focus indicators (built-in Payload components) */}
      <section className="test-section" data-testid="section-good-payload">
        <h2>Good Focus Indicators (Payload Components)</h2>
        <div className="button-group">
          <Button id="payload-button-1">Payload Button 1</Button>
          <Button buttonStyle="secondary" id="payload-button-2">
            Payload Button 2
          </Button>
          <Button buttonStyle="icon-label" icon="plus" id="payload-button-3">
            Add Item
          </Button>
        </div>
      </section>

      {/* Section 2: Standard HTML with good focus indicators */}
      <section className="test-section" data-testid="section-good-html">
        <h2>Good Focus Indicators (Standard HTML)</h2>
        <div className="button-group">
          <button className="good-focus" id="good-button-1" type="button">
            Good Button 1
          </button>
          <button className="good-focus-outline" id="good-button-2" type="button">
            Good Button 2 (Outline)
          </button>
          <button className="good-focus-shadow" id="good-button-3" type="button">
            Good Button 3 (Shadow)
          </button>
        </div>
        <div className="link-group">
          <a className="good-focus" href="#section1" id="good-link-1">
            Good Link 1
          </a>
          <a className="good-focus-outline" href="#section2" id="good-link-2">
            Good Link 2
          </a>
        </div>
      </section>

      {/* Section 3: Elements with focus indicators on pseudo-elements */}
      <section className="test-section" data-testid="section-pseudo">
        <h2>Focus Indicators via Pseudo-elements</h2>
        <div className="button-group">
          <button className="focus-after-outline" id="pseudo-after-outline" type="button">
            After Outline
          </button>
          <button className="focus-before-border" id="pseudo-before-border" type="button">
            Before Border
          </button>
          <button className="focus-after-shadow" id="pseudo-after-shadow" type="button">
            After Shadow
          </button>
        </div>
      </section>

      {/* Section 4: BAD - No focus indicators */}
      <section className="test-section" data-testid="section-bad">
        {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
        <h2>⚠️ Bad Focus Indicators (Should Fail)</h2>
        <div className="button-group">
          <button className="no-focus" id="bad-button-1" type="button">
            No Focus 1
          </button>
          <button className="no-focus" id="bad-button-2" type="button">
            No Focus 2
          </button>
          <button className="transparent-focus" id="bad-button-3" type="button">
            Transparent Focus
          </button>
        </div>
        <div className="link-group">
          <a className="no-focus" href="#bad1" id="bad-link-1">
            Bad Link 1
          </a>
          <a className="no-focus" href="#bad2" id="bad-link-2">
            Bad Link 2
          </a>
        </div>
        <input
          className="no-focus"
          id="bad-input-1"
          placeholder="Input without focus indicator"
          type="text"
        />
      </section>

      {/* Section 5: Mixed - Some good, some bad */}
      <section className="test-section" data-testid="section-mixed">
        <h2>Mixed Focus Indicators</h2>
        <div className="form-group">
          <label htmlFor="good-input-1">
            Good Input:
            <input className="good-focus" id="good-input-1" placeholder="Good focus" type="text" />
          </label>
          <label htmlFor="bad-input-2">
            Bad Input:
            <input className="no-focus" id="bad-input-2" placeholder="No focus" type="text" />
          </label>
          <label htmlFor="good-select-1">
            Good Select:
            <select className="good-focus" id="good-select-1">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </label>
          <label htmlFor="bad-select-1">
            Bad Select:
            <select className="no-focus" id="bad-select-1">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </label>
        </div>
      </section>

      {/* Section 6: Edge cases */}
      <section className="test-section" data-testid="section-edge-cases">
        <h2>Edge Cases</h2>
        <div className="button-group">
          <button className="zero-width-border" id="zero-width-border" type="button">
            Zero Width Border
          </button>
          <button className="zero-opacity-shadow" id="zero-opacity-shadow" type="button">
            Zero Opacity Shadow
          </button>
          <button className="transparent-outline" id="transparent-outline" type="button">
            Transparent Outline
          </button>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="good-focus" id="focusable-div" tabIndex={0}>
            Focusable Div
          </div>
        </div>
      </section>

      {/* Section 7: Disabled elements (should not be in tab order) */}
      <section className="test-section" data-testid="section-disabled">
        <h2>Disabled Elements (Not in Tab Order)</h2>
        <div className="button-group">
          <button disabled id="disabled-button" type="button">
            Disabled Button
          </button>
          <input disabled id="disabled-input" placeholder="Disabled input" type="text" />
        </div>
      </section>
    </div>
  )
}
