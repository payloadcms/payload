'use client'
import type { ClientWidget } from 'payload'

import {
  Button,
  DrawerToggler,
  ItemsDrawer,
  type ReactSelectOption as Option,
  ReactSelect,
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
        <span>
          {t('general:editing')} {t('general:dashboard')}
        </span>
        <div className="dashboard-breadcrumb-dropdown__actions">
          <DrawerToggler className="drawer-toggler--unstyled" slug={widgetsDrawerSlug}>
            <Button buttonStyle="pill" el="span" size="small">
              {t('fields:addLabel', {
                label: '+',
              })}
            </Button>
          </DrawerToggler>
          <Button buttonStyle="pill" onClick={onSaveChanges} size="small">
            {t('fields:saveChanges')}
          </Button>
          <Button buttonStyle="pill" onClick={onCancel} size="small">
            {t('general:cancel')}
          </Button>
        </div>
      </div>
    )
  }

  const options = [
    { label: `${t('general:edit')} ${t('general:dashboard')}`, value: 'edit' },
    { label: `${t('general:reset')} ${t('general:layout')}`, value: 'reset' },
  ]

  const handleChange = (selectedOption: Option | Option[]) => {
    // Since isMulti is false, we expect a single Option
    const option = Array.isArray(selectedOption) ? selectedOption[0] : selectedOption

    if (option?.value === 'edit') {
      onEditClick()
    } else if (option?.value === 'reset') {
      onResetLayout()
    }
  }

  return (
    <ReactSelect
      className="dashboard-breadcrumb-select"
      isClearable={false}
      isSearchable={false}
      menuIsOpen={undefined} // Let ReactSelect handle open/close
      onChange={handleChange}
      options={options}
      placeholder={t('general:dashboard')}
      value={{ label: t('general:dashboard'), value: 'dashboard' }}
    />
  )
}
