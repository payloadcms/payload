'use client'

import { useModal } from '@faceless-ui/modal'
import { hasAutosaveEnabled, hasScheduledPublishEnabled } from 'payload/shared'
import React, { useMemo, useState } from 'react'

import { useFormModified } from '../../forms/Form/context.js'
import { ScheduleIcon } from '../../icons/Schedule/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ScheduleDrawer } from '../PublishButton/ScheduleDrawer/index.js'
import { Tooltip } from '../Tooltip/index.js'

export const SchedulePublishButton: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { id, collectionSlug, globalSlug, hasPublishPermission, unpublishedVersionCount } =
    useDocumentInfo()

  const { getEntityConfig } = useConfig()
  const { isModalOpen, toggleModal } = useModal()
  const { t } = useTranslation()
  const modified = useFormModified()
  const [hovered, setHovered] = useState(false)

  const entityConfig = useMemo(() => {
    if (collectionSlug) {
      return getEntityConfig({ collectionSlug })
    }
    if (globalSlug) {
      return getEntityConfig({ globalSlug })
    }
  }, [collectionSlug, globalSlug, getEntityConfig])

  const scheduledPublishEnabled = hasScheduledPublishEnabled(entityConfig)
  const hasAutosave = hasAutosaveEnabled(entityConfig)

  const canSchedulePublish = Boolean(
    scheduledPublishEnabled &&
      hasPublishPermission &&
      (globalSlug || (collectionSlug && id)) &&
      (hasAutosave || !modified),
  )

  const drawerSlug = `schedule-publish-${id}`
  const hasNewerVersions = unpublishedVersionCount > 0

  if (!canSchedulePublish) {
    return null
  }

  const label = t('version:schedulePublish')

  return (
    <React.Fragment>
      <span
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        style={{ position: 'relative' }}
      >
        <Button
          buttonStyle="ghost"
          disabled={disabled}
          icon={<ScheduleIcon />}
          id="schedule-publish-button"
          onClick={() => toggleModal(drawerSlug)}
        />
        <Tooltip delay={0} show={hovered}>
          {label}
        </Tooltip>
      </span>
      {isModalOpen(drawerSlug) && (
        <ScheduleDrawer
          defaultType={!hasNewerVersions ? 'unpublish' : 'publish'}
          schedulePublishConfig={
            scheduledPublishEnabled &&
            typeof entityConfig.versions.drafts.schedulePublish === 'object'
              ? entityConfig.versions.drafts.schedulePublish
              : undefined
          }
          slug={drawerSlug}
        />
      )}
    </React.Fragment>
  )
}
