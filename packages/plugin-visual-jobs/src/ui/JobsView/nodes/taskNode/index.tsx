'use client'
import type { JobLog } from 'payload'

import './index.scss'

import { ErrorIcon, SuccessIcon } from '@payloadcms/ui'
import { Handle, Position } from '@xyflow/react'
import React, { memo } from 'react'

export const TaskNode: React.FC<{
  data: JobLog
  isConnectable: boolean
}> = memo(({ data, isConnectable }) => {
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
          data.state === 'succeeded' ? 'taskNode--succeeded' : 'taskNode--failed',
        ].join(' ')}
      >
        {data.state === 'succeeded' ? <SuccessIcon /> : <ErrorIcon />}
        <div className="taskNode__label">
          <strong>{data.taskID}</strong>
          <span>{data.id}</span>
        </div>
      </div>

      <Handle id="a" isConnectable={isConnectable} position={Position.Bottom} type="source" />
    </>
  )
})
