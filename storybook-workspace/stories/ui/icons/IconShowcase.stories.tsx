import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

// Import all available icons
import { CalendarIcon } from '../../../packages/ui/src/icons/Calendar'
import { CheckIcon } from '../../../packages/ui/src/icons/Check'
import { ChevronIcon } from '../../../packages/ui/src/icons/Chevron'
import { CloseMenuIcon } from '../../../packages/ui/src/icons/CloseMenu'
import { CodeBlockIcon } from '../../../packages/ui/src/icons/CodeBlock'
import { CopyIcon } from '../../../packages/ui/src/icons/Copy'
import { DocumentIcon } from '../../../packages/ui/src/icons/Document'
import { Dots as DotsIcon } from '../../../packages/ui/src/icons/Dots'
import { DragHandleIcon } from '../../../packages/ui/src/icons/DragHandle'
import { EditIcon } from '../../../packages/ui/src/icons/Edit'
import { ExternalLinkIcon } from '../../../packages/ui/src/icons/ExternalLink'
import { EyeIcon } from '../../../packages/ui/src/icons/Eye'
import { FolderIcon } from '../../../packages/ui/src/icons/Folder'
import { GearIcon } from '../../../packages/ui/src/icons/Gear'
import { GridViewIcon } from '../../../packages/ui/src/icons/GridView'
import { LineIcon } from '../../../packages/ui/src/icons/Line'
import { LinkIcon } from '../../../packages/ui/src/icons/Link'
import { ListViewIcon } from '../../../packages/ui/src/icons/ListView'
import { LockIcon } from '../../../packages/ui/src/icons/Lock'
import { LogOutIcon } from '../../../packages/ui/src/icons/LogOut'
import { MenuIcon } from '../../../packages/ui/src/icons/Menu'
import { MinimizeMaximizeIcon } from '../../../packages/ui/src/icons/MinimizeMaximize'
import { MoreIcon } from '../../../packages/ui/src/icons/More'
import { MoveFolderIcon } from '../../../packages/ui/src/icons/MoveFolder'
import { PeopleIcon } from '../../../packages/ui/src/icons/People'
import { PlusIcon } from '../../../packages/ui/src/icons/Plus'
import { SearchIcon } from '../../../packages/ui/src/icons/Search'
import { SortDownIcon as SortIcon } from '../../../packages/ui/src/icons/Sort'
import { SwapIcon } from '../../../packages/ui/src/icons/Swap'
import { ThreeDotsIcon } from '../../../packages/ui/src/icons/ThreeDots'
import { TrashIcon } from '../../../packages/ui/src/icons/Trash'
import { XIcon } from '../../../packages/ui/src/icons/X'

const iconComponents = [
  { name: 'Calendar', category: 'General', component: CalendarIcon },
  { name: 'Check', category: 'Actions', component: CheckIcon },
  { name: 'Chevron', category: 'Navigation', component: ChevronIcon },
  { name: 'CloseMenu', category: 'Navigation', component: CloseMenuIcon },
  { name: 'CodeBlock', category: 'Content', component: CodeBlockIcon },
  { name: 'Copy', category: 'Actions', component: CopyIcon },
  { name: 'Document', category: 'Content', component: DocumentIcon },
  { name: 'Dots', category: 'Interface', component: DotsIcon },
  { name: 'DragHandle', category: 'Interface', component: DragHandleIcon },
  { name: 'Edit', category: 'Actions', component: EditIcon },
  { name: 'ExternalLink', category: 'Navigation', component: ExternalLinkIcon },
  { name: 'Eye', category: 'Actions', component: EyeIcon },
  { name: 'Folder', category: 'Content', component: FolderIcon },
  { name: 'Gear', category: 'Settings', component: GearIcon },
  { name: 'GridView', category: 'Views', component: GridViewIcon },
  { name: 'Line', category: 'Interface', component: LineIcon },
  { name: 'Link', category: 'Navigation', component: LinkIcon },
  { name: 'ListView', category: 'Views', component: ListViewIcon },
  { name: 'Lock', category: 'Security', component: LockIcon },
  { name: 'LogOut', category: 'Actions', component: LogOutIcon },
  { name: 'Menu', category: 'Navigation', component: MenuIcon },
  { name: 'MinimizeMaximize', category: 'Interface', component: MinimizeMaximizeIcon },
  { name: 'More', category: 'Interface', component: MoreIcon },
  { name: 'MoveFolder', category: 'Actions', component: MoveFolderIcon },
  { name: 'People', category: 'Content', component: PeopleIcon },
  { name: 'Plus', category: 'Actions', component: PlusIcon },
  { name: 'Search', category: 'Actions', component: SearchIcon },
  { name: 'Sort', category: 'Interface', component: SortIcon },
  { name: 'Swap', category: 'Actions', component: SwapIcon },
  { name: 'ThreeDots', category: 'Interface', component: ThreeDotsIcon },
  { name: 'Trash', category: 'Actions', component: TrashIcon },
  { name: 'X', category: 'Navigation', component: XIcon },
]

const IconGrid = ({ icons, size = 24 }: { icons: any[]; size?: number }) => (
  <div
    style={{
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      padding: '16px 0',
    }}
  >
    {icons.map(({ name, component: IconComponent }) => (
      <div
        key={name}
        style={{
          alignItems: 'center',
          backgroundColor: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
        }}
      >
        <IconComponent style={{ height: `${size}px`, marginBottom: '8px', width: `${size}px` }} />
        <span style={{ fontSize: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
          {name}
        </span>
      </div>
    ))}
  </div>
)

const meta = {
  parameters: {
    docs: {
      description: {
        component: 'Complete showcase of all Payload CMS icon components organized by category.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'UI/Icons/Complete Showcase',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h2>All Payload Icons ({iconComponents.length} total)</h2>
      <IconGrid icons={iconComponents} />
    </div>
  ),
}

export const ByCategory: Story = {
  render: () => {
    const categories = Array.from(new Set(iconComponents.map((icon) => icon.category)))

    return (
      <div style={{ padding: '24px' }}>
        <h2>Icons by Category</h2>
        {categories.map((category) => {
          const categoryIcons = iconComponents.filter((icon) => icon.category === category)
          return (
            <div key={category} style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  borderBottom: '2px solid #007acc',
                  color: '#007acc',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                }}
              >
                {category} ({categoryIcons.length} icons)
              </h3>
              <IconGrid icons={categoryIcons} />
            </div>
          )
        })}
      </div>
    )
  },
}

export const DifferentSizes: Story = {
  render: () => {
    const sampleIcons = iconComponents.slice(0, 6)

    return (
      <div style={{ padding: '24px' }}>
        <h2>Icon Sizes</h2>

        {[16, 20, 24, 32, 48].map((size) => (
          <div key={size} style={{ marginBottom: '24px' }}>
            <h3>Size: {size}px</h3>
            <IconGrid icons={sampleIcons} size={size} />
          </div>
        ))}
      </div>
    )
  },
}

export const ColorVariations: Story = {
  render: () => {
    const colors = [
      { name: 'Default', value: 'currentColor' },
      { name: 'Primary', value: '#007acc' },
      { name: 'Success', value: '#28a745' },
      { name: 'Warning', value: '#ffc107' },
      { name: 'Danger', value: '#dc3545' },
      { name: 'Secondary', value: '#6c757d' },
    ]

    const sampleIcons = [PlusIcon, EditIcon, TrashIcon, SearchIcon]

    return (
      <div style={{ padding: '24px' }}>
        <h2>Icon Colors</h2>

        <div
          style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {colors.map(({ name, value }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <h4
                style={{ color: value !== 'currentColor' ? value : '#333', marginBottom: '16px' }}
              >
                {name}
              </h4>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '16px',
                }}
              >
                {sampleIcons.map((IconComponent, index) => (
                  <IconComponent
                    key={index}
                    style={{
                      color: value,
                      height: '24px',
                      width: '24px',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
