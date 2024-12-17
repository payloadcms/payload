'use client'
import type { ClientCollectionConfig } from 'payload'

import {
  SelectInput,
  SetDocumentStepNav,
  useConfig,
  useDocumentInfo,
  useTheme,
} from '@payloadcms/ui'
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import React, { useCallback, useEffect, useState } from 'react'

import type { RetrySequences } from './utilities/logsToRetrySequences.js'

import { NodePanel } from './components/NodePanel/index.js'
import { TaskNode } from './nodes/taskNode/index.js'

const nodeTypes = {
  taskNode: TaskNode,
}

export const JobsViewClient: React.FC<{ retrySequences: RetrySequences }> = (props) => {
  const { retrySequences } = props
  const { theme } = useTheme()
  const { getEntityConfig } = useConfig()
  const { id } = useDocumentInfo()
  const collectionConfig = getEntityConfig({
    collectionSlug: 'payload-jobs',
  }) as ClientCollectionConfig

  const [run, setRun] = React.useState<string>(String(retrySequences.length - 1))

  const log = retrySequences[Number(run)]

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  useEffect(() => {
    setNodes(
      log.map((entry, index) => {
        return {
          id: entry.id,
          type: 'taskNode',
          data: entry,
          position: { x: 0, y: index * 100 },
        } as Node
      }),
    )

    setEdges(
      log
        .map((entry, index) => {
          if (index === 0) {
            return
          }
          return {
            id: `e${log[index - 1].id}-${entry.id}`,
            markerEnd: {
              type: 'arrowclosed',
              color: theme === 'light' ? 'black' : 'white',
              height: 25,
              strokeWidth: 2,
              width: 25,
            },
            // Set completion time between entry.completedAt and log[index - 1].completedAt
            label: `${String(
              new Date(entry.completedAt).getTime() -
                new Date(log[index - 1].completedAt).getTime(),
            )} ms`,
            source: log[index - 1].id,
            target: entry.id,
          } as Edge
        })
        .filter(Boolean),
    )
  }, [log, retrySequences, theme])

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )
  return (
    <div>
      <SetDocumentStepNav
        collectionSlug={'payload-jobs'}
        globalLabel={undefined}
        globalSlug={undefined}
        id={id}
        pluralLabel={collectionConfig ? collectionConfig?.labels?.plural : undefined}
        useAsTitle={collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined}
        view="Visualize"
      />
      <SelectInput
        label={'Job Run'}
        name="run"
        onChange={(option) => {
          if (Array.isArray(option)) {
            return
          }
          const value = option.value

          setRun(value as string)
        }}
        options={retrySequences
          .map((sequence, index) => {
            if (index === retrySequences.length - 1) {
              return {
                label: 'Latest',
                value: String(index),
              }
            }
            return {
              label: `Run ${index + 1}`,
              value: String(index),
            }
          })
          .reverse()}
        path="run"
        value={run}
      />
      <div style={{ height: '1000px', width: '100%' }}>
        <br />
        <ReactFlow
          colorMode={theme}
          edges={edges}
          nodes={nodes}
          nodesConnectable={false}
          nodeTypes={nodeTypes}
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
        >
          <Background />
          <Controls />
          <NodePanel />
        </ReactFlow>
      </div>
    </div>
  )
}
