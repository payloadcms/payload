'use client'

import { Button } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const buttonStyles = [
  'primary',
  'secondary',
  'pill',
  'icon-label',
  'transparent',
  'subtle',
  'dashed',
  'error',
  'tab',
  'none',
] as const

const sizes = ['large', 'medium', 'small', 'xsmall'] as const

export const ButtonStyles: React.FC = () => {
  return (
    <div style={{ padding: 'var(--gutter-h)' }}>
      <Link href="/admin">Dashboard</Link>
      <h1 style={{ marginTop: 'var(--base)' }}>Buttons</h1>

      <h2 style={{ marginBottom: 'calc(var(--base) * 1)', marginTop: 'calc(var(--base) * 2)' }}>
        Styles × Sizes
      </h2>
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

      <h2 style={{ marginBottom: 'calc(var(--base) * 1)', marginTop: 'calc(var(--base) * 3)' }}>
        With Icons
      </h2>
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
                  <Button buttonStyle={style} icon="edit" margin={false} size={size}>
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
                  <Button
                    aria-label="Edit"
                    buttonStyle={style}
                    icon="edit"
                    margin={false}
                    size={size}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginBottom: 'calc(var(--base) * 1)', marginTop: 'calc(var(--base) * 3)' }}>
        Disabled States
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {buttonStyles.map((style) => (
          <Button buttonStyle={style} disabled key={style} margin={false}>
            {style}
          </Button>
        ))}
      </div>
    </div>
  )
}
