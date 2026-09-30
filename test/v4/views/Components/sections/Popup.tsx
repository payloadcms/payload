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
        render={() => <p>Popup content goes here</p>}
      />
    </Variant>
    <Variant label="Horizontal: Right">
      <Popup
        button={<Button buttonStyle="secondary">Right Aligned</Button>}
        buttonType="custom"
        horizontalAlign="right"
        render={() => <p>Right aligned popup</p>}
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
              button={<PopupList.Button>Theme</PopupList.Button>}
              buttonType="custom"
              className="components-view__popup-menu"
              hoverSubmenu
              popupAriaLabel="Theme menu"
              popupType="menu"
              render={() => (
                <PopupList.MenuItem>
                  <Popup
                    button={<PopupList.Button>Color</PopupList.Button>}
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
                    side="right"
                    size="large"
                  />
                  <PopupList.Button onClick={() => {}}>Typography</PopupList.Button>
                </PopupList.MenuItem>
              )}
              side="right"
              size="large"
            />
            <Popup
              button={<PopupList.Button>Language</PopupList.Button>}
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
