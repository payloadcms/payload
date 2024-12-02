'use client'

import type { JobLog } from 'payload'

import { Panel, useNodes } from '@xyflow/react'

import './index.scss'

import React from 'react'

import { type PanelTab, Tabs } from './Tabs.js'

const ErrorDisplay = ({ error }: { error: any }) => {
  const formatStack = (stack: string) => {
    return stack.split('\n').map((line, index) => (
      <div className="stack-line" key={index}>
        {line.trim()}
      </div>
    ))
  }

  return (
    <div className="error-container">
      <div className="detail-row">
        <span className="label">Error Type:</span>
        <span className="value error-type">{error.name}</span>
      </div>
      <div className="detail-row">
        <span className="label">Message:</span>
        <span className="value error-message">{error.message}</span>
      </div>
      {error.stack && (
        <div className="stack-trace">
          <div className="stack-header">Stack Trace:</div>
          <div className="stack-content">{formatStack(error.stack)}</div>
        </div>
      )}
    </div>
  )
}

export const NodePanel = () => {
  const nodes = useNodes()

  const selectedNodes = nodes.filter((node) => node.selected)

  if (selectedNodes.length !== 1) {
    return null
  }

  const taskLog = selectedNodes[0].data as JobLog

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const tabs: PanelTab[] = [
    {
      name: 'Metadata',
      Content: (
        <div className="task-details">
          <div className="detail-row">
            <span className="label">Task ID:</span>
            <span className="value">{taskLog.taskID}</span>
          </div>
          <div className="detail-row">
            <span className="label">Task Slug:</span>
            <span className="value">{taskLog.taskSlug}</span>
          </div>
          <div className="detail-row">
            <span className="label">State:</span>
            <span className={`value state ${taskLog.state}`}>{taskLog.state}</span>
          </div>
          <div className="detail-row">
            <span className="label">Executed At:</span>
            <span className="value">{formatDate(taskLog.executedAt)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Completed At:</span>
            <span className="value">{formatDate(taskLog.completedAt)}</span>
          </div>

          <div className="detail-row">
            <span className="label">ID:</span>
            <span className="value">{taskLog.id}</span>
          </div>
          {taskLog.error ? <ErrorDisplay error={taskLog.error} /> : null}
        </div>
      ),
    },
  ]

  if (taskLog.input && Object.keys(taskLog.input).length > 0) {
    tabs.push({
      name: 'Input',
      Content: <pre>{JSON.stringify(taskLog.input, null, 2)}</pre>,
    })
  }

  if (taskLog.output && Object.keys(taskLog.output).length > 0) {
    tabs.push({
      name: 'Output',
      Content: <pre>{JSON.stringify(taskLog.output, null, 2)}</pre>,
    })
  }

  return (
    <Panel className="nodePanel" position="top-right">
      <Tabs tabs={tabs} />
    </Panel>
  )
}
