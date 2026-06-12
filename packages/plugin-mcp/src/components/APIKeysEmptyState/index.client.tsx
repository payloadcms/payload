'use client'

import type { NoResultsClientProps } from 'payload'

import { Button, NoListResults } from '@payloadcms/ui'
import React from 'react'

export const APIKeysEmptyState: React.FC<NoResultsClientProps> = ({
  hasCreatePermission,
  newDocumentURL,
  viewType,
}) => (
  <NoListResults
    Actions={
      hasCreatePermission && newDocumentURL && viewType !== 'trash'
        ? [
            <Button el="link" key="create" to={newDocumentURL}>
              Generate API Key
            </Button>,
          ]
        : []
    }
    description="API keys control which collections, resources, tools, and prompts MCP clients can access."
    title="No API Keys"
    withMargin
  />
)
