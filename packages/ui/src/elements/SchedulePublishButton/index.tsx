'use client'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL, hasAutosaveEnabled, hasScheduledPublishEnabled } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFormModified } from '../../forms/Form/context.js'
import { ScheduleIcon } from '../../icons/Schedule/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { buildUpcomingScheduleWhere } from '../PublishButton/ScheduleDrawer/buildUpcomingScheduleWhere.js'
import { ScheduleDrawer } from '../PublishButton/ScheduleDrawer/index.js'
import { Tooltip } from '../Tooltip/index.js'

export const SchedulePublishButton: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { id, collectionSlug, globalSlug, hasPublishPermission, unpublishedVersionCount } =
    useDocumentInfo()

  const {
    config: {
      routes: { api },
    },
    getEntityConfig,
  } = useConfig()
  const { isModalOpen, toggleModal } = useModal()
  const { i18n, t } = useTranslation()
  const modified = useFormModified()
  const [hovered, setHovered] = useState(false)
  const [hasScheduledPublish, setHasScheduledPublish] = useState(false)

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

  const fetchHasScheduledPublish = useCallback(async () => {
    const { totalDocs } = await requests
      .post(formatAdminURL({ apiRoute: api, path: '/payload-jobs/count' }), {
        body: qs.stringify({
          where: buildUpcomingScheduleWhere({ id, collectionSlug, globalSlug }),
        }),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Payload-HTTP-Method-Override': 'GET',
        },
      })
      .then((res) => res.json())

    setHasScheduledPublish(totalDocs > 0)
  }, [api, collectionSlug, globalSlug, id, i18n.language])

  useEffect(() => {
    if (canSchedulePublish) {
      void fetchHasScheduledPublish().catch(() => {})
    }
  }, [canSchedulePublish, fetchHasScheduledPublish])

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
