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
  { name: 'Calendar', component: CalendarIcon, category: 'General' },
  { name: 'Check', component: CheckIcon, category: 'Actions' },
  { name: 'Chevron', component: ChevronIcon, category: 'Navigation' },
  { name: 'CloseMenu', component: CloseMenuIcon, category: 'Navigation' },
  { name: 'CodeBlock', component: CodeBlockIcon, category: 'Content' },
  { name: 'Copy', component: CopyIcon, category: 'Actions' },
  { name: 'Document', component: DocumentIcon, category: 'Content' },
  { name: 'Dots', component: DotsIcon, category: 'Interface' },
  { name: 'DragHandle', component: DragHandleIcon, category: 'Interface' },
  { name: 'Edit', component: EditIcon, category: 'Actions' },
  { name: 'ExternalLink', component: ExternalLinkIcon, category: 'Navigation' },
  { name: 'Eye', component: EyeIcon, category: 'Actions' },
  { name: 'Folder', component: FolderIcon, category: 'Content' },
  { name: 'Gear', component: GearIcon, category: 'Settings' },
  { name: 'GridView', component: GridViewIcon, category: 'Views' },
  { name: 'Line', component: LineIcon, category: 'Interface' },
  { name: 'Link', component: LinkIcon, category: 'Navigation' },
  { name: 'ListView', component: ListViewIcon, category: 'Views' },
  { name: 'Lock', component: LockIcon, category: 'Security' },
  { name: 'LogOut', component: LogOutIcon, category: 'Actions' },
  { name: 'Menu', component: MenuIcon, category: 'Navigation' },
  { name: 'MinimizeMaximize', component: MinimizeMaximizeIcon, category: 'Interface' },
  { name: 'More', component: MoreIcon, category: 'Interface' },
  { name: 'MoveFolder', component: MoveFolderIcon, category: 'Actions' },
  { name: 'People', component: PeopleIcon, category: 'Content' },
  { name: 'Plus', component: PlusIcon, category: 'Actions' },
  { name: 'Search', component: SearchIcon, category: 'Actions' },
  { name: 'Sort', component: SortIcon, category: 'Interface' },
  { name: 'Swap', component: SwapIcon, category: 'Actions' },
  { name: 'ThreeDots', component: ThreeDotsIcon, category: 'Interface' },
  { name: 'Trash', component: TrashIcon, category: 'Actions' },
  { name: 'X', component: XIcon, category: 'Navigation' },
]

const IconGrid = ({ icons, size = 24 }: { icons: any[], size?: number }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
    gap: '16px',
    padding: '16px 0'
  }}>
    {icons.map(({ name, component: IconComponent }) => (
      <div key={name} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
      }}>
        <IconComponent style={{ width: `${size}px`, height: `${size}px`, marginBottom: '8px' }} />
        <span style={{ fontSize: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
          {name}
        </span>
      </div>
    ))}
  </div>
)

const meta = {
  title: 'UI/Icons/Complete Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete showcase of all Payload CMS icon components organized by category.',
      },
    },
  },
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
    const categories = Array.from(new Set(iconComponents.map(icon => icon.category)))
    
    return (
      <div style={{ padding: '24px' }}>
        <h2>Icons by Category</h2>
        {categories.map(category => {
          const categoryIcons = iconComponents.filter(icon => icon.category === category)
          return (
            <div key={category} style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                marginBottom: '16px', 
                paddingBottom: '8px', 
                borderBottom: '2px solid #007acc',
                color: '#007acc'
              }}>
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
        
        {[16, 20, 24, 32, 48].map(size => (
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
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {colors.map(({ name, value }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '16px', color: value !== 'currentColor' ? value : '#333' }}>
                {name}
              </h4>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                {sampleIcons.map((IconComponent, index) => (
                  <IconComponent 
                    key={index}
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      color: value 
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