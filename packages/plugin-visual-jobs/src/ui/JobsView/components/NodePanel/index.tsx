'use client'

import { Panel } from '@xyflow/react'
import React from 'react'

import './index.scss'
import { useSelectedTaskContext } from '../context.js'

export const NodePanel = () => {
  const { taskLog } = useSelectedTaskContext()

  return (
    <Panel className="nodePanel" position="top-right">
      <h1>Selected Task</h1>
      <pre>{JSON.stringify(taskLog, null, 2)}</pre>
    </Panel>
  )
}
