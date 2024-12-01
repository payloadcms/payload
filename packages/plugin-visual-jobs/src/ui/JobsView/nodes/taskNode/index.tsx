'use client'
import type { JobLog } from 'payload'

import { Handle, Position } from '@xyflow/react'

import './index.scss'

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
        className={['taskNode', isSelected ? 'taskNode--selected' : ''].join(' ')}
        onClick={onHandleClick}
      >
        <strong>
          {data.taskSlug} Task {data.taskID}
        </strong>
        <span>{data.id}</span>
      </div>

      <Handle id="a" isConnectable={isConnectable} position={Position.Bottom} type="source" />
    </>
  )
})
