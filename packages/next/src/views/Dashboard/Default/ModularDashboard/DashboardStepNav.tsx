'use client'
import type { ClientWidget } from 'payload'

import {
  Button,
  ChevronIcon,
  DrawerToggler,
  ItemsDrawer,
  Popup,
  PopupList,
  useStepNav,
  useTranslation,
} from '@payloadcms/ui'
import { useEffect, useId } from 'react'

export function DashboardStepNav({
  addWidget,
  cancel,
  isEditing,
  resetLayout,
  saveLayout,
  setIsEditing,
  widgets,
}: {
  addWidget: (slug: string) => void
  cancel: () => void
  isEditing: boolean
  resetLayout: () => Promise<void>
  saveLayout: () => Promise<void>
  setIsEditing: (isEditing: boolean) => void
  widgets: ClientWidget[]
}) {
  const { t } = useTranslation()
  const { setStepNav } = useStepNav()
  const uuid = useId()
  const drawerSlug = `widgets-drawer-${uuid}`

  useEffect(() => {
    setStepNav([
      {
        label: (
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
  }, [isEditing, drawerSlug, cancel, resetLayout, saveLayout, setIsEditing, setStepNav])

  return (
    <>
      {isEditing && (
        <ItemsDrawer
          drawerSlug={drawerSlug}
          items={widgets}
          onItemClick={(widget) => addWidget(widget.slug)}
          searchPlaceholder={t('dashboard:searchWidgets')}
          title={t('dashboard:addWidget')}
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

  if (isEditing) {
    return (
      <div className="dashboard-breadcrumb-dropdown__editing">
        <span>{t('dashboard:editingDashboard')}</span>
        <div className="dashboard-breadcrumb-dropdown__actions">
          <DrawerToggler className="drawer-toggler--unstyled" slug={widgetsDrawerSlug}>
            <Button buttonStyle="primary" el="span" size="medium">
              {t('dashboard:addButton')}
            </Button>
          </DrawerToggler>
          <Button buttonStyle="pill" onClick={onSaveChanges} size="medium">
            {t('fields:saveChanges')}
          </Button>
          <Button buttonStyle="pill" onClick={onCancel} size="medium">
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
      renderButton={({ active: _active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          aria-label={t('general:dashboard')}
          buttonStyle="ghost"
          extraButtonProps={{ onKeyDown }}
          onClick={onClick}
          {...ariaProps}
        >
          <span className="dashboard-breadcrumb-dropdown__label">
            {t('general:dashboard')}
            <ChevronIcon direction="down" size={16} />
          </span>
        </Button>
      )}
      size="large"
    />
  )
}
