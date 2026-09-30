'use client'

import { Button, Popup, PopupList } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const PopupSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="popup" selectedComponent={selectedComponent} title="Popup">
    <Variant label="Default">
      <Popup
        button={<Button buttonStyle="secondary">Open Popup</Button>}
        buttonType="custom"
        render={() => (
          <div style={{ padding: '16px' }}>
            <p>Popup content goes here</p>
          </div>
        )}
      />
    </Variant>
    <Variant label="Horizontal: Right">
      <Popup
        button={<Button buttonStyle="secondary">Right Aligned</Button>}
        buttonType="custom"
        horizontalAlign="right"
        render={() => (
          <div style={{ padding: '16px' }}>
            <p>Right aligned popup</p>
          </div>
        )}
      />
    </Variant>
    <Variant label="Nested hover menus">
      <Popup
        button={<Button buttonStyle="secondary">Open nested menu</Button>}
        buttonType="custom"
        className="components-view__popup-menu"
        popupAriaLabel="Nested menu level one"
        popupType="menu"
        render={() => (
          <PopupList.MenuItem>
            <Popup
              buttonType="custom"
              className="components-view__popup-menu"
              hoverSubmenu
              popupAriaLabel="Theme menu"
              popupType="menu"
              render={() => (
                <PopupList.MenuItem>
                  <Popup
                    buttonType="custom"
                    className="components-view__popup-menu"
                    hoverSubmenu
                    popupAriaLabel="Color menu"
                    popupType="menu"
                    render={() => (
                      <PopupList.MenuItem>
                        <PopupList.Button onClick={() => {}}>Light</PopupList.Button>
                        <PopupList.Button onClick={() => {}}>Dark</PopupList.Button>
                      </PopupList.MenuItem>
                    )}
                    renderButton={({ active, role, tabIndex, ...props }) => (
                      <Button
                        {...props}
                        buttonStyle="ghost"
                        className="components-view__popup-menu-trigger"
                        extraButtonProps={{ role, tabIndex }}
                        margin={false}
                        selected={active}
                      >
                        Color
                      </Button>
                    )}
                    side="right"
                    size="large"
                  />
                  <PopupList.Button onClick={() => {}}>Typography</PopupList.Button>
                </PopupList.MenuItem>
              )}
              renderButton={({ active, role, tabIndex, ...props }) => (
                <Button
                  {...props}
                  buttonStyle="ghost"
                  className="components-view__popup-menu-trigger"
                  extraButtonProps={{ role, tabIndex }}
                  margin={false}
                  selected={active}
                >
                  Theme
                </Button>
              )}
              side="right"
              size="large"
            />
            <Popup
              buttonType="custom"
              className="components-view__popup-menu"
              hoverSubmenu
              popupAriaLabel="Language menu"
              popupType="menu"
              render={() => (
                <PopupList.MenuItem>
                  <PopupList.Button onClick={() => {}}>English</PopupList.Button>
                  <PopupList.Button onClick={() => {}}>French</PopupList.Button>
                </PopupList.MenuItem>
              )}
              renderButton={({ active, role, tabIndex, ...props }) => (
                <Button
                  {...props}
                  buttonStyle="ghost"
                  className="components-view__popup-menu-trigger"
                  extraButtonProps={{ role, tabIndex }}
                  margin={false}
                  selected={active}
                >
                  Language
                </Button>
              )}
              side="right"
              size="large"
            />
          </PopupList.MenuItem>
        )}
        size="large"
      />
    </Variant>
  </Section>
)
