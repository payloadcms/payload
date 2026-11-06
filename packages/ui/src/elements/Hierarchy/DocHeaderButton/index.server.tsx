import type { Payload, PayloadComponent } from 'payload'

import { parsePayloadComponent } from 'payload/shared'
import React from 'react'

import { FolderIcon } from '../../../icons/Folder/index.js'
import { RenderServerComponent } from '../../RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { HierarchyButtonClient } from '../../../exports/client/index.js'

export type HierarchyButtonServerProps = {
  fieldName: string
  hasMany?: boolean
  hierarchyCollectionSlug: string
  payload: Payload
}

export const HierarchyButton: React.FC<HierarchyButtonServerProps> = ({
  fieldName,
  hasMany,
  hierarchyCollectionSlug,
  payload,
}) => {
  const hierarchyCollectionConfig = payload.config.collections.find(
    (c) => c.slug === hierarchyCollectionSlug,
  )
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const IconComponent = hierarchyConfig?.admin.components.Icon
  const SmallIconComponent = hierarchyConfig?.admin.components.SmallIcon

  // Render the custom icon if provided, otherwise use FolderIcon directly
  // Important: Must render the icon here on server to avoid hydration mismatch
  // For default FolderIcon path, render directly to avoid import map requirement
  const isDefaultFolderIcon = isFolderIcon({ component: IconComponent })
  const renderedIcon = isDefaultFolderIcon
    ? renderFolderIcon({ component: IconComponent, size: 16 })
    : RenderServerComponent({
        Component: IconComponent,
        importMap: payload.importMap,
        key: `hierarchy-button-icon-${hierarchyCollectionSlug}`,
      })

  // Render the small icon for compact display (pill button)
  // Reuse the full icon if SmallIcon is the same component
  const isDefaultSmallIcon = isFolderIcon({ component: SmallIconComponent })
  const renderedSmallIcon =
    SmallIconComponent === IconComponent
      ? renderedIcon
      : isDefaultSmallIcon
        ? renderFolderIcon({ component: SmallIconComponent })
        : RenderServerComponent({
            Component: SmallIconComponent,
            importMap: payload.importMap,
            key: `hierarchy-button-small-icon-${hierarchyCollectionSlug}`,
          })

  return (
    <HierarchyButtonClient
      fieldName={fieldName}
      hasMany={hasMany}
      hierarchyCollectionSlug={hierarchyCollectionSlug}
      Icon={renderedIcon}
      SmallIcon={renderedSmallIcon}
    />
  )
}

/**
 * Matches the default folder icon in both string and object form, e.g. the folders preset's
 * `{ path: '@payloadcms/ui#FolderIcon', clientProps }`, so it renders without the import map.
 */
function isFolderIcon({ component }: { component?: PayloadComponent }): boolean {
  if (!component) {
    return true
  }

  const { exportName, path } = parsePayloadComponent(component)

  return path === '@payloadcms/ui' && exportName === 'FolderIcon'
}

/**
 * Renders the default folder icon without the import map. The object form gets what the import map
 * would have rendered: `FolderIcon` with the props it supports from `clientProps`.
 */
function renderFolderIcon({
  component,
  size,
}: {
  component?: PayloadComponent
  size?: 16 | 24
}): React.ReactElement {
  if (component && typeof component === 'object') {
    return <FolderIcon {...getFolderIconProps({ clientProps: component.clientProps })} />
  }

  return <FolderIcon size={size} />
}

function getFolderIconProps({ clientProps }: { clientProps?: object }): {
  className?: string
  size?: 16 | 24
} {
  if (!clientProps) {
    return {}
  }

  const className =
    'className' in clientProps && typeof clientProps.className === 'string'
      ? clientProps.className
      : undefined
  const size =
    'size' in clientProps && (clientProps.size === 16 || clientProps.size === 24)
      ? clientProps.size
      : undefined

  return { className, size }
}
