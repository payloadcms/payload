'use client'

import { Button } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const buttonStyles = ['primary', 'secondary', 'pill', 'dashed', 'destructive', 'ghost'] as const

const sizes = ['medium', 'large'] as const

const cellStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
}

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  borderBottom: '1px solid var(--border-default)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: 600,
  textAlign: 'left',
  textTransform: 'uppercase' as const,
}

const bodyCellStyle: React.CSSProperties = {
  ...cellStyle,
  borderBottom: '1px solid var(--border-subtle)',
}

const labelCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  fontFamily: 'monospace',
  fontWeight: 600,
  textTransform: 'capitalize' as const,
  whiteSpace: 'nowrap' as const,
}

const Section: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div style={{ marginBottom: '3rem' }}>
    <h2
      style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '1rem',
      }}
    >
      {title}
    </h2>
    {children}
  </div>
)

const ButtonTable: React.FC<{
  icon?: React.ComponentProps<typeof Button>['icon']
  iconOnly?: boolean
}> = ({ icon, iconOnly }) => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>
        <th style={headerCellStyle}>Style</th>
        <th style={headerCellStyle}>Size</th>
        <th style={headerCellStyle}>Default</th>
        <th style={headerCellStyle}>Disabled</th>
      </tr>
    </thead>
    <tbody>
      {buttonStyles.map((style) =>
        sizes.map((size, sizeIdx) => (
          <tr key={`${style}-${size}`}>
            {sizeIdx === 0 && (
              <td rowSpan={sizes.length} style={labelCellStyle}>
                {style}
              </td>
            )}
            <td style={{ ...bodyCellStyle, fontFamily: 'monospace', fontSize: '13px' }}>{size}</td>
            <td style={bodyCellStyle}>
              <Button
                aria-label={iconOnly ? style : undefined}
                buttonStyle={style}
                icon={icon}
                margin={false}
                size={size}
              >
                {iconOnly ? undefined : 'Button'}
              </Button>
            </td>
            <td style={bodyCellStyle}>
              <Button
                aria-label={iconOnly ? style : undefined}
                buttonStyle={style}
                disabled
                icon={icon}
                margin={false}
                size={size}
              >
                {iconOnly ? undefined : 'Button'}
              </Button>
            </td>
          </tr>
        )),
      )}
    </tbody>
  </table>
)

export const ButtonStyles: React.FC = () => {
  return (
    <div style={{ maxWidth: '900px', padding: 'var(--gutter-h)' }}>
      <Link href="/admin">Dashboard</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1.5rem 0' }}>Button Styles</h1>

      <Section title="Label Only">
        <ButtonTable />
      </Section>

      <Section title="With Icon (right)">
        <ButtonTable icon="plus" />
      </Section>

      <Section title="With Icon (left)">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Style</th>
              <th style={headerCellStyle}>Size</th>
              <th style={headerCellStyle}>Default</th>
              <th style={headerCellStyle}>Disabled</th>
            </tr>
          </thead>
          <tbody>
            {buttonStyles.map((style) =>
              sizes.map((size, sizeIdx) => (
                <tr key={`${style}-${size}`}>
                  {sizeIdx === 0 && (
                    <td rowSpan={sizes.length} style={labelCellStyle}>
                      {style}
                    </td>
                  )}
                  <td style={{ ...bodyCellStyle, fontFamily: 'monospace', fontSize: '13px' }}>
                    {size}
                  </td>
                  <td style={bodyCellStyle}>
                    <Button
                      buttonStyle={style}
                      icon="plus"
                      iconPosition="left"
                      margin={false}
                      size={size}
                    >
                      Button
                    </Button>
                  </td>
                  <td style={bodyCellStyle}>
                    <Button
                      buttonStyle={style}
                      disabled
                      icon="plus"
                      iconPosition="left"
                      margin={false}
                      size={size}
                    >
                      Button
                    </Button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </Section>

      <Section title="Icon Only">
        <ButtonTable icon="edit" iconOnly />
      </Section>

      <Section title="Other Styles">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Style</th>
              <th style={headerCellStyle}>Size</th>
              <th style={headerCellStyle}>Default</th>
              <th style={headerCellStyle}>Disabled</th>
            </tr>
          </thead>
          <tbody>
            {(['subtle', 'tab', 'icon-label', 'none'] as const).map((style) =>
              sizes.map((size, sizeIdx) => (
                <tr key={`${style}-${size}`}>
                  {sizeIdx === 0 && (
                    <td rowSpan={sizes.length} style={labelCellStyle}>
                      {style}
                    </td>
                  )}
                  <td style={{ ...bodyCellStyle, fontFamily: 'monospace', fontSize: '13px' }}>
                    {size}
                  </td>
                  <td style={bodyCellStyle}>
                    <Button buttonStyle={style} icon="edit" margin={false} size={size}>
                      Button
                    </Button>
                  </td>
                  <td style={bodyCellStyle}>
                    <Button buttonStyle={style} disabled icon="edit" margin={false} size={size}>
                      Button
                    </Button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </Section>
    </div>
  )
}
