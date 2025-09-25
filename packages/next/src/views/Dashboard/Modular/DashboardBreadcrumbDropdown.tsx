'use client'

import { Button } from '@payloadcms/ui/elements/Button'
import { type Option, ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import React from 'react'

import './DashboardBreadcrumbDropdown.scss'

interface DashboardBreadcrumbDropdownProps {
  isEditing: boolean
  onAddWidget: () => void
  onCancel: () => void
  onEditClick: () => void
  onResetLayout: () => void
  onSaveChanges: () => void
}

export function DashboardBreadcrumbDropdown({
  isEditing,
  onAddWidget,
  onCancel,
  onEditClick,
  onResetLayout,
  onSaveChanges,
}: DashboardBreadcrumbDropdownProps) {
  if (isEditing) {
    // In editing mode, show Dashboard as text with inline actions
    return (
      <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
        <span>Dashboard</span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <Button buttonStyle="pill" onClick={onAddWidget} size="small">
            Add +
          </Button>
          <Button buttonStyle="pill" onClick={onSaveChanges} size="small">
            Save Changes
          </Button>
          <Button buttonStyle="pill" onClick={onCancel} size="small">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // buttonStyle?:
  // | 'error'
  // | 'icon-label'
  // | 'none'
  // | 'pill'
  // | 'primary'
  // | 'secondary'
  // | 'subtle'
  // | 'tab'
  // | 'transparent'

  // In view mode, show Dashboard as dropdown using ReactSelect
  const options = [
    { label: 'Edit Dashboard', value: 'edit' },
    { label: 'Reset Layout', value: 'reset' },
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
      placeholder="Dashboard"
      value={{ label: 'Dashboard', value: 'dashboard' }}
    />
  )
}
