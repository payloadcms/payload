import React, { useEffect, useState } from 'react'

import { useStepNav } from '../../elements/StepNav/index.js'
import { useAuth } from '../../utilities/Auth/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import RenderCustomComponent from '../../utilities/RenderCustomComponent/index.js'
import DefaultDashboard from './Default.js'

const Dashboard: React.FC = () => {
  const { permissions, user } = useAuth()
  const { setStepNav } = useStepNav()
  const [filteredGlobals, setFilteredGlobals] = useState([])

  const {
    admin: {
      components: {
        views: { Dashboard: CustomDashboard } = {
          Dashboard: undefined,
        },
      } = {},
    } = {},
    collections,
    globals,
  } = useConfig()

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.globals?.[global.slug]?.read?.permission),
    )
  }, [permissions, globals])

  useEffect(() => {
    setStepNav([])
  }, [setStepNav])

  return (
    <RenderCustomComponent
      componentProps={{
        collections: collections.filter(
          (collection) => permissions?.collections?.[collection.slug]?.read?.permission,
        ),
        globals: filteredGlobals,
        permissions,
        user,
      }}
      CustomComponent={CustomDashboard}
      DefaultComponent={DefaultDashboard}
    />
  )
}

export default Dashboard
