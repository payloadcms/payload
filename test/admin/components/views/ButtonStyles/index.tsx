'use client'

import { Button } from '@payloadcms/ui'
import React from 'react'

const buttonStyles = [
  'primary',
  'secondary',
  'pill',
  'icon-label',
  'transparent',
  'subtle',
  'dashed',
  'error',
  'muted-text',
  'tab',
  'none',
] as const

const sizes = ['large', 'medium', 'small', 'xsmall'] as const

export const ButtonStyles: React.FC = () => {
  return (
    <div style={{ marginTop: 'calc(var(--base) * 2)', padding: 'var(--gutter-h)' }}>
      <h1>Button Styles</h1>

      <h2 style={{ marginTop: 'calc(var(--base) * 2)' }}>Styles × Sizes</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th
              style={{
                borderBottom: '1px solid var(--theme-elevation-200)',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              Style
            </th>
            {sizes.map((size) => (
              <th
                key={size}
                style={{
                  borderBottom: '1px solid var(--theme-elevation-200)',
                  padding: '8px',
                  textAlign: 'left',
                }}
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buttonStyles.map((style) => (
            <tr key={style}>
              <td
                style={{
                  borderBottom: '1px solid var(--theme-elevation-100)',
                  fontFamily: 'monospace',
                  padding: '8px',
                }}
              >
                {style}
              </td>
              {sizes.map((size) => (
                <td
                  key={size}
                  style={{ borderBottom: '1px solid var(--theme-elevation-100)', padding: '8px' }}
                >
                  <Button buttonStyle={style} margin={false} size={size}>
                    Button
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 'calc(var(--base) * 3)' }}>With Icons</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th
              style={{
                borderBottom: '1px solid var(--theme-elevation-200)',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              Style
            </th>
            {sizes.map((size) => (
              <th
                key={size}
                style={{
                  borderBottom: '1px solid var(--theme-elevation-200)',
                  padding: '8px',
                  textAlign: 'left',
                }}
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buttonStyles.map((style) => (
            <tr key={style}>
              <td
                style={{
                  borderBottom: '1px solid var(--theme-elevation-100)',
                  fontFamily: 'monospace',
                  padding: '8px',
                }}
              >
                {style}
              </td>
              {sizes.map((size) => (
                <td
                  key={size}
                  style={{ borderBottom: '1px solid var(--theme-elevation-100)', padding: '8px' }}
                >
                  <Button buttonStyle={style} icon="plus" size={size}>
                    Button
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 'calc(var(--base) * 3)' }}>Icon Only</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th
              style={{
                borderBottom: '1px solid var(--theme-elevation-200)',
                padding: '8px',
                textAlign: 'left',
              }}
            >
              Style
            </th>
            {sizes.map((size) => (
              <th
                key={size}
                style={{
                  borderBottom: '1px solid var(--theme-elevation-200)',
                  padding: '8px',
                  textAlign: 'left',
                }}
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buttonStyles.map((style) => (
            <tr key={style}>
              <td
                style={{
                  borderBottom: '1px solid var(--theme-elevation-100)',
                  fontFamily: 'monospace',
                  padding: '8px',
                }}
              >
                {style}
              </td>
              {sizes.map((size) => (
                <td
                  key={size}
                  style={{ borderBottom: '1px solid var(--theme-elevation-100)', padding: '8px' }}
                >
                  <Button aria-label="Add" buttonStyle={style} icon="plus" size={size} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 'calc(var(--base) * 3)' }}>Disabled States</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {buttonStyles.map((style) => (
          <Button buttonStyle={style} disabled key={style}>
            {style}
          </Button>
        ))}
      </div>

      <h2 style={{ marginTop: 'calc(var(--base) * 3)' }}>Round Buttons</h2>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {sizes.map((size) => (
          <Button aria-label="Add" icon="plus" key={size} round size={size} />
        ))}
      </div>
    </div>
  )
}
