'use client'

import React from 'react'

import type { CreatedAtCellProps } from '../../../Versions/cells/CreatedAt/index.js'

import { useModal } from '../../../../elements/Modal/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from '../../../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../../../providers/RouteTransition/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { formatDate } from '../../../../utilities/formatDocTitle/formatDateTitle.js'

export const VersionDrawerCreatedAtCell: React.FC<CreatedAtCellProps> = ({
  rowData: { id, updatedAt } = {},
}) => {
  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()
  const { closeAllModals } = useModal()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()

  const { i18n } = useTranslation()

  return (
    <button
      className="created-at-cell"
      onClick={() => {
        closeAllModals()
        const current = new URLSearchParams(Array.from(searchParams.entries()))

        if (id) {
          current.set('versionFrom', String(id))
        }

        const search = current.toString()
        const query = search ? `?${search}` : ''

        startRouteTransition(() => router.push(`${pathname}${query}`))
      }}
      type="button"
    >
      {formatDate({ date: updatedAt, i18n, pattern: dateFormat })}
    </button>
  )
}
