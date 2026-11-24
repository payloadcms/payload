'use client'
import type { ClientWidget } from 'payload'

import { useEffect, useId, useRef } from 'react'

import { Button } from '../../../../elements/Button/index.js'
import { DrawerToggler } from '../../../../elements/Drawer/index.js'
import { ItemsDrawer } from '../../../../elements/ItemsDrawer/index.js'
import { Popup } from '../../../../elements/Popup/index.js'
import * as PopupList from '../../../../elements/Popup/PopupButtonList/index.js'
import { useStepNav } from '../../../../elements/StepNav/index.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { useEmbed } from '../../../../providers/Embed/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'

export function DashboardStepNav({
  addWidget,
  cancel,
  isEditing,
  resetLayout,
  saveLayout,
  setIsEditing,
  widgets,
}: {
  addWidget: (args: { widgetSlug: string }) => void
  cancel: () => void
  isEditing: boolean
  resetLayout: () => Promise<void>
  saveLayout: () => Promise<void>
  setIsEditing: (isEditing: boolean) => void
  widgets: ClientWidget[]
}) {
  const { t } = useTranslation()
  const { setStepNav } = useStepNav()
  const { isEmbedded } = useEmbed()
  const uuid = useId()
  const drawerSlug = `widgets-drawer-${uuid}`

  useEffect(() => {
    setStepNav([
      {
        label: isEmbedded ? (
          <span>{t('general:dashboard')}</span>
        ) : (
          <DashboardBreadcrumbDropdown
            isEditing={isEditing}
            onCancel={cancel}
            onEditClick={() => setIsEditing(true)}
            onResetLayout={resetLayout}
            onSaveChanges={saveLayout}
            widgetsDrawerSlug={drawerSlug}
          />
        ),
      },
    ])
  }, [
    isEditing,
    isEmbedded,
    drawerSlug,
    cancel,
    resetLayout,
    saveLayout,
    setIsEditing,
    setStepNav,
    t,
  ])

  return (
    <>
      {!isEmbedded && isEditing && (
        <ItemsDrawer
          drawerSlug={drawerSlug}
          isDraggable
          items={widgets}
          onItemClick={(widget) => addWidget({ widgetSlug: widget.slug })}
          searchPlaceholder={t('dashboard:searchWidgets')}
          title={t('dashboard:addWidget')}
          variant="widgets"
        />
      )}
    </>
  )
}

export function DashboardBreadcrumbDropdown(props: {
  isEditing: boolean
  onCancel: () => void
  onEditClick: () => void
  onResetLayout: () => void
  onSaveChanges: () => void
  widgetsDrawerSlug: string
}) {
  const { isEditing, onCancel, onEditClick, onResetLayout, onSaveChanges, widgetsDrawerSlug } =
    props
  const { t } = useTranslation()

  const triggerRef = useRef<HTMLButtonElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(isEditing)

  useEffect(() => {
    if (isEditing) {
      addButtonRef.current?.focus()
    }
    if (wasEditing.current && !isEditing) {
      triggerRef.current?.focus()
    }
    wasEditing.current = isEditing
  }, [isEditing])

  if (isEditing) {
    return (
      <div className="dashboard-breadcrumb-dropdown__editing">
        <span>{t('dashboard:editingDashboard')}</span>
        <div className="dashboard-breadcrumb-dropdown__actions">
          <DrawerToggler
            aria-label={t('dashboard:addWidget')}
            buttonStyle="primary"
            extraButtonProps={{ ref: addButtonRef }}
            slug={widgetsDrawerSlug}
          >
            {t('dashboard:addButton')}
          </DrawerToggler>
          <Button buttonStyle="secondary" onClick={onSaveChanges} size="medium">
            {t('fields:saveChanges')}
          </Button>
          <Button buttonStyle="secondary" onClick={onCancel} size="medium">
            {t('general:cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Popup
      className="dashboard-breadcrumb-dropdown"
      horizontalAlign="left"
      popupType="menu"
      render={({ close }) => (
        <PopupList.ButtonGroup>
          <PopupList.Button
            onClick={() => {
              close()
              onEditClick()
            }}
          >
            {t('dashboard:editDashboard')}
          </PopupList.Button>
          <PopupList.Button
            onClick={() => {
              close()
              onResetLayout()
            }}
          >
            {t('dashboard:resetLayout')}
          </PopupList.Button>
        </PopupList.ButtonGroup>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={t('general:dashboard')}
          buttonStyle="ghost"
          extraButtonProps={{ onKeyDown, ref: triggerRef }}
          onClick={onClick}
          selected={active}
          {...ariaProps}
        >
          <span className="dashboard-breadcrumb-dropdown__label">
            {t('general:dashboard')}
            <ChevronIcon direction="down" size={16} />
          </span>
        </Button>
      )}
      size="fit-content"
    />
  )
}
