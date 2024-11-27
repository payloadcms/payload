'use client'
import type { ClientField, Data, FormState, JsonObject } from 'payload'

import { Drawer, EditDepthProvider, useModal } from '@payloadcms/ui'
import React from 'react'

import { DrawerContent } from './DrawerContent.js'

export type FieldsDrawerProps = {
  readonly className?: string
  readonly data?: Data
  readonly drawerSlug: string
  readonly drawerTitle?: string
  readonly featureKey: string
  readonly fieldMapOverride?: ClientField[]
  readonly handleDrawerSubmit: (fields: FormState, data: JsonObject) => void
  readonly schemaFieldsPathOverride?: string
  readonly schemaPath: string
  readonly schemaPathSuffix?: string
}

/**
 * This FieldsDrawer component can be used to easily create a Drawer that contains a form with fields within your feature.
 * The fields are taken directly from the schema map based on your `featureKey` and `schemaPathSuffix`. Thus, this can only
 * be used if you provide your field schema inside the `generateSchemaMap` prop of your feature.server.ts.
 */
export const FieldsDrawer: React.FC<FieldsDrawerProps> = ({
  className,
  data,
  drawerSlug,
  drawerTitle,
  featureKey,
  fieldMapOverride,
  handleDrawerSubmit,
  schemaFieldsPathOverride,
  schemaPath,
  schemaPathSuffix,
}) => {
  const { closeModal } = useModal()
  // The Drawer only renders its children (and itself) if it's open. Thus, by extracting the main content
  // to DrawerContent, this should be faster
  return (
    <EditDepthProvider>
      <Drawer className={className} slug={drawerSlug} title={drawerTitle ?? ''}>
        <DrawerContent
          data={data}
          featureKey={featureKey}
          fieldMapOverride={fieldMapOverride}
          handleDrawerSubmit={(args, args2) => {
            // Simply close drawer - no need for useLexicalDrawer here as at this point,
            // we don't need to restore the cursor position. This is handled by the useEffect in useLexicalDrawer.
            closeModal(drawerSlug)

            // Actual drawer submit logic needs to be triggered after the drawer is closed.
            // That's because the lexical selection / cursor restore logic that is striggerer by
            // `useLexicalDrawer` neeeds to be triggered before any editor.update calls that may happen
            // in the `handleDrawerSubmit` function.
            setTimeout(() => {
              handleDrawerSubmit(args, args2)
            }, 1)
          }}
          schemaFieldsPathOverride={schemaFieldsPathOverride}
          schemaPath={schemaPath}
          schemaPathSuffix={schemaPathSuffix}
        />
      </Drawer>
    </EditDepthProvider>
  )
}
