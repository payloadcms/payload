'use client'

import type { Props as ButtonProps } from '@payloadcms/ui/elements/Button'

import { Button } from '@payloadcms/ui'
import { PlusIcon } from '@payloadcms/ui/icons/Plus'
import React from 'react'

import { Section } from '../shared.js'

const styles: Array<ButtonProps['buttonStyle']> = [
  'primary',
  'secondary',
  'pill',
  'dashed',
  'destructive',
  'ghost',
]

const sizes: Array<ButtonProps['size']> = ['medium', 'large']

const StyleRow: React.FC<{
  disabled?: boolean
  size: ButtonProps['size']
  style: ButtonProps['buttonStyle']
}> = ({ disabled, size, style }) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
    <Button buttonStyle={style} disabled={disabled} size={size}>
      Action
    </Button>
    <Button
      buttonStyle={style}
      disabled={disabled}
      icon={<PlusIcon />}
      iconPosition="left"
      size={size}
    >
      Action
    </Button>
    <Button
      buttonStyle={style}
      disabled={disabled}
      icon={<PlusIcon />}
      iconPosition="right"
      size={size}
    >
      Action
    </Button>
  </div>
)

export const ButtonSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="button" selectedComponent={selectedComponent} title="Button">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {styles.map((style) => (
        <div key={style} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <strong style={{ textTransform: 'capitalize' }}>{style}</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sizes.map((size) => (
              <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{size}</span>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <StyleRow size={size} style={style} />
                  <StyleRow disabled size={size} style={style} />
                  <Button buttonStyle={style} loading size={size}>
                    Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Section>
)
