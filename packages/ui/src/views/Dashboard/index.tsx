import React, { useEffect, useState } from 'react'

import type { SanitizedGlobalConfig } from '../../../../exports/types'

import { useStepNav } from '../../elements/StepNav'
import { useActions } from '../../utilities/ActionsProvider'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import DefaultDashboard from './Default'

const Dashboard: React.FC = () => {
  const { permissions, user } = useAuth()
  const { setStepNav } = useStepNav()
  const [filteredGlobals, setFilteredGlobals] = useState<SanitizedGlobalConfig[]>([])

  const {
    admin: { components: { views: { Dashboard: CustomDashboardComponent } = {} } = {} } = {},
    collections,
    globals,
  } = useConfig()

  const { setViewActions } = useActions()

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.globals?.[global.slug]?.read?.permission),
    )
  }, [permissions, globals])

  useEffect(() => {
    setStepNav([])
  }, [setStepNav])

  useEffect(() => {
    setViewActions([])
  }, [setViewActions])

  return (
    <RenderCustomComponent
      CustomComponent={
        typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
      }
      DefaultComponent={DefaultDashboard}
      componentProps={{
        collections: collections.filter(
          (collection) => permissions?.collections?.[collection.slug]?.read?.permission,
        ),
        globals: filteredGlobals,
        permissions,
        user,
      }}
    />
  )
}

export default Dashboard
