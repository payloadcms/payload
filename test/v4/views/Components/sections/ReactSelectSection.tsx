'use client'

import {
  Button,
  Drawer,
  formatDrawerSlug,
  Popup,
  ReactSelect,
  TextInput,
  useModal,
} from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Dragonfruit', value: 'dragonfruit' },
  { label: 'Elderberry', value: 'elderberry' },
]

const DRAWER_SLUG = formatDrawerSlug({ slug: 'react-select-portal-test', depth: 1 })

const DrawerVariant: React.FC = () => {
  const { openModal } = useModal()
  const [value, setValue] = useState<null | { label: string; value: string }>(null)

  return (
    <>
      <Button buttonStyle="secondary" onClick={() => openModal(DRAWER_SLUG)}>
        Open Drawer with ReactSelect
      </Button>
      <Drawer slug={DRAWER_SLUG} title="ReactSelect in Drawer">
        <div style={{ padding: '24px' }}>
          <p style={{ marginBottom: '12px' }}>
            The dropdown menu should portal to <code>document.body</code> and appear above the
            drawer without being clipped.
          </p>
          <ReactSelect
            onChange={(v) => setValue(v as { label: string; value: string })}
            options={options}
            value={value}
          />
        </div>
      </Drawer>
    </>
  )
}

export const ReactSelectSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  const [defaultValue, setDefaultValue] = useState<null | { label: string; value: string }>(null)
  const [overflowValue, setOverflowValue] = useState<null | { label: string; value: string }>(null)
  const [popupValue, setPopupValue] = useState<null | { label: string; value: string }>(null)
  const [noPortalValue, setNoPortalValue] = useState<null | { label: string; value: string }>(null)

  return (
    <Section id="select" selectedComponent={selectedComponent} title="ReactSelect">
      <Variant label="Default (portals to document.body)">
        <ReactSelect
          onChange={(v) => setDefaultValue(v as { label: string; value: string })}
          options={options}
          value={defaultValue}
        />
      </Variant>

      <Variant label="Inside overflow:hidden container (dropdown should escape)">
        <div
          style={{
            border: '2px dashed var(--theme-elevation-500)',
            borderRadius: '4px',
            height: '60px',
            overflow: 'hidden',
            padding: '8px',
          }}
        >
          <ReactSelect
            onChange={(v) => setOverflowValue(v as { label: string; value: string })}
            options={options}
            value={overflowValue}
          />
        </div>
      </Variant>

      <Variant label="Inside Popup (dropdown should escape Popup's overflow)">
        <Popup
          button={<Button buttonStyle="secondary">Open Popup with ReactSelect</Button>}
          buttonType="custom"
          render={() => (
            <div style={{ padding: '16px', width: '280px' }}>
              <p style={{ marginBottom: '8px', fontSize: '13px' }}>
                Dropdown should portal above this popup:
              </p>
              <ReactSelect
                onChange={(v) => setPopupValue(v as { label: string; value: string })}
                options={options}
                value={popupValue}
              />
            </div>
          )}
        />
      </Variant>

      <Variant label="Inside dark-themed Popup (dropdown should inherit dark theme)">
        <Popup
          button={<Button buttonStyle="secondary">Open Dark Popup</Button>}
          buttonType="custom"
          render={() => (
            <div style={{ padding: '16px', width: '280px' }}>
              <p style={{ marginBottom: '8px', fontSize: '13px' }}>
                Both the input and dropdown menu should be dark-themed:
              </p>
              <div style={{ marginBottom: '12px' }}>
                <TextInput label="Text field" onChange={() => {}} path="dark-popup-text" value="" />
              </div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                Select field:
              </label>
              <ReactSelect
                onChange={(v) => setPopupValue(v as { label: string; value: string })}
                options={options}
                value={popupValue}
              />
            </div>
          )}
          theme="dark"
        />
      </Variant>

      <Variant label="Inside Drawer (dropdown should escape Drawer's overflow)">
        <DrawerVariant />
      </Variant>

      <Variant label="Opt-out: menuPortalTarget={null} (no portal, clipped by ancestors)">
        <div
          style={{
            border: '2px dashed var(--theme-elevation-500)',
            borderRadius: '4px',
            height: '60px',
            overflow: 'hidden',
            padding: '8px',
          }}
        >
          <ReactSelect
            menuPortalTarget={null}
            onChange={(v) => setNoPortalValue(v as { label: string; value: string })}
            options={options}
            value={noPortalValue}
          />
        </div>
      </Variant>
    </Section>
  )
}
