import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

// Icons exported from @payloadcms/ui package
import {
  CalendarIcon,
  CheckIcon,
  ChevronIcon,
  CloseMenuIcon,
  CodeBlockIcon,
  CopyIcon,
  DocumentIcon,
  DragHandleIcon,
  EditIcon,
  ExternalLinkIcon,
  FolderIcon,
  GearIcon,
  GridViewIcon,
  LineIcon,
  LinkIcon,
  ListViewIcon,
  LogOutIcon,
  MenuIcon,
  MinimizeMaximizeIcon,
  MoreIcon,
  MoveFolderIcon,
  PlusIcon,
  SearchIcon,
  SwapIcon,
  XIcon,
} from '@payloadcms/ui'
// Icons NOT exported from main package - using direct imports
import { Dots as DotsIcon } from '../../../packages/ui/src/icons/Dots'
import { EyeIcon } from '../../../packages/ui/src/icons/Eye'
import { LockIcon } from '../../../packages/ui/src/icons/Lock'
import { PeopleIcon } from '../../../packages/ui/src/icons/People'
import { SortDownIcon as SortIcon } from '../../../packages/ui/src/icons/Sort'
import { ThreeDotsIcon } from '../../../packages/ui/src/icons/ThreeDots'
import { TrashIcon } from '../../../packages/ui/src/icons/Trash'

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
          backgroundColor: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
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
                  borderBottom: '2px solid var(--theme-input-bg)',
                  color: 'var(--theme-input-bg)',
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
      { name: 'Primary', value: 'var(--theme-input-bg)' },
      { name: 'Success', value: 'var(--theme-success-500)' },
      { name: 'Warning', value: 'var(--theme-warning-500)' },
      { name: 'Danger', value: 'var(--theme-error-500)' },
      { name: 'Secondary', value: 'var(--theme-elevation-400)' },
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
                style={{
                  color: value !== 'currentColor' ? value : 'var(--theme-elevation-800)',
                  marginBottom: '16px',
                }}
              >
                {name}
              </h4>
              <div
                style={{
                  backgroundColor: 'var(--theme-elevation-50)',
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
