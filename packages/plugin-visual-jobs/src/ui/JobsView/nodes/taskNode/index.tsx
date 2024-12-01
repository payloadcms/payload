'use client'
import type { JobLog } from 'payload'

import './index.scss'

import { ErrorIcon, SuccessIcon } from '@payloadcms/ui'
import { Handle, Position } from '@xyflow/react'
import React, { memo } from 'react'

import { useSelectedTaskContext } from '../../components/context.js'

export const TaskNode: React.FC<{
  data: JobLog
  isConnectable: boolean
}> = memo(({ data, isConnectable }) => {
  const { setTaskLog, taskLog } = useSelectedTaskContext()

  const isSelected = taskLog?.id === data.id

  const onHandleClick = () => {
    console.log('clicked')
    setTaskLog(data)
  }

  return (
    <>
      <Handle
        isConnectable={isConnectable}
        onConnect={(params) => console.log('handle onConnect', params)}
        position={Position.Top}
        type="target"
      />
      <div
        className={[
          'taskNode',
          isSelected ? 'taskNode--selected' : '',
          data.state === 'succeeded' ? 'taskNode--succeeded' : 'taskNode--failed',
        ].join(' ')}
        onClick={onHandleClick}
      >
        {data.state === 'succeeded' ? <SuccessIcon /> : <ErrorIcon />}
        <div className="taskNode__label">
          <strong>
            {data.taskSlug} Task {data.taskID}
          </strong>
          <span>{data.id}</span>
        </div>
      </div>

      <Handle id="a" isConnectable={isConnectable} position={Position.Bottom} type="source" />
    </>
  )
})
