'use client'

import { useModal } from '@faceless-ui/modal'
import { hasAutosaveEnabled, hasScheduledPublishEnabled } from 'payload/shared'
import React, { useMemo, useState } from 'react'

import { useFormModified } from '../../forms/Form/context.js'
import { ScheduleIcon } from '../../icons/Schedule/index.js'
import { useBranchParam } from '../../providers/Branch/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ScheduleDrawer } from '../PublishButton/ScheduleDrawer/index.js'
import { Tooltip } from '../Tooltip/index.js'

export const SchedulePublishButton: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const {
    id,
    collectionSlug,
    globalSlug,
    hasPublishPermission,
    hasScheduledPublish,
    setHasScheduledPublish,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { getEntityConfig } = useConfig()
  const { isModalOpen, toggleModal } = useModal()
  const { t } = useTranslation()
  const modified = useFormModified()
  const branch = useBranchParam()
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
      (hasAutosave || !modified) &&
      // The job runs with no branch on its request, so it would publish main's copy
      // of the document rather than the branch's (§18). Not offered on a branch at
      // all; `schedulePublishHandler` refuses it server-side too.
      !branch,
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
          icon={<ScheduleIcon active={hasScheduledPublish} />}
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
          onUpcomingChange={setHasScheduledPublish}
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
