'use client'
import React from 'react'

import type { Props as ButtonProps } from '../Button/types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import './index.scss'

const baseClass = 'list-selection'

type ListSelection_v4Props = {
  /**
   * The count of selected items
   */
  readonly count: number
  /**
   * Actions that apply to the list as a whole
   *
   * @example select all, clear selection
   */
  readonly ListActions?: React.ReactNode[]
  /**
   * Actions that apply to the selected items
   *
   * @example edit, delete, publish, unpublish
   */
  readonly SelectionActions?: React.ReactNode[]
}
export function ListSelection_v4({ count, ListActions, SelectionActions }: ListSelection_v4Props) {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <span>{t('general:selectedCount', { count, label: '' })}</span>
      {ListActions && ListActions.length > 0 && (
        <React.Fragment>
          <span>&mdash;</span>
          <div className={`${baseClass}__actions`}>{ListActions}</div>
        </React.Fragment>
      )}
      {SelectionActions && SelectionActions.length > 0 && (
        <React.Fragment>
          <span>&mdash;</span>
          <div className={`${baseClass}__actions`}>{SelectionActions}</div>
        </React.Fragment>
      )}
    </div>
  )
}

type ListSelectionButtonProps = {} & ButtonProps
export function ListSelectionButton({ children, className, ...props }: ListSelectionButtonProps) {
  return (
    <Button
      {...props}
      buttonStyle="none"
      className={[`${baseClass}__button`, className].filter(Boolean).join(' ')}
    >
      {children}
    </Button>
  )
}
