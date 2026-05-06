'use client'

import { AlignJustifiedIcon } from '@payloadcms/ui/icons/AlignJustified'
import { ArrowIcon } from '@payloadcms/ui/icons/Arrow'
import { CalendarIcon } from '@payloadcms/ui/icons/Calendar'
import { CheckIcon } from '@payloadcms/ui/icons/Check'
import { ChevronIcon } from '@payloadcms/ui/icons/Chevron'
import { CircledXIcon } from '@payloadcms/ui/icons/CircledX'
import { CirclePlusIcon } from '@payloadcms/ui/icons/CirclePlus'
import { ClipboardIcon } from '@payloadcms/ui/icons/Clipboard'
import { CloseMenuIcon } from '@payloadcms/ui/icons/CloseMenu'
import { CodeBlockIcon } from '@payloadcms/ui/icons/CodeBlock'
import { CopyIcon } from '@payloadcms/ui/icons/Copy'
import { DocumentIcon } from '@payloadcms/ui/icons/Document'
import { DuplicateIcon } from '@payloadcms/ui/icons/Duplicate'
import { EditIcon } from '@payloadcms/ui/icons/Edit'
import { ExternalLinkIcon } from '@payloadcms/ui/icons/ExternalLink'
import { EyeIcon } from '@payloadcms/ui/icons/Eye'
import { FilterIcon } from '@payloadcms/ui/icons/Filter'
import { FolderIcon } from '@payloadcms/ui/icons/Folder'
import { GearIcon } from '@payloadcms/ui/icons/Gear'
import { GridViewIcon } from '@payloadcms/ui/icons/GridView'
import { LineIcon } from '@payloadcms/ui/icons/Line'
import { LinkIcon } from '@payloadcms/ui/icons/Link'
import { LockIcon } from '@payloadcms/ui/icons/Lock'
import { LockOpenIcon } from '@payloadcms/ui/icons/LockOpen'
import { LogOutIcon } from '@payloadcms/ui/icons/LogOut'
import { MinimizeMaximizeIcon } from '@payloadcms/ui/icons/MinimizeMaximize'
import { MoreIcon } from '@payloadcms/ui/icons/More'
import { MoveFolderIcon } from '@payloadcms/ui/icons/MoveFolder'
import { PeopleIcon } from '@payloadcms/ui/icons/People'
import { PlusIcon } from '@payloadcms/ui/icons/Plus'
import { RefreshIcon } from '@payloadcms/ui/icons/Refresh'
import { SearchIcon } from '@payloadcms/ui/icons/Search'
import { SortDownIcon } from '@payloadcms/ui/icons/Sort'
import { SpinnerIcon } from '@payloadcms/ui/icons/Spinner'
import { SwapIcon } from '@payloadcms/ui/icons/Swap'
import { TagIcon } from '@payloadcms/ui/icons/Tag'
import { ThreeDotsIcon } from '@payloadcms/ui/icons/ThreeDots'
import { TrashIcon } from '@payloadcms/ui/icons/Trash'
import { WriteIcon } from '@payloadcms/ui/icons/Write'
import { XIcon } from '@payloadcms/ui/icons/X'
import React from 'react'

import { Section } from '../shared.js'

const icons = [
  { name: 'AlignJustified', Icon: AlignJustifiedIcon },
  { name: 'Arrow', Icon: ArrowIcon },
  { name: 'Calendar', Icon: CalendarIcon },
  { name: 'Check', Icon: CheckIcon },
  { name: 'CircledX', Icon: CircledXIcon },
  { name: 'CirclePlus', Icon: CirclePlusIcon },
  { name: 'Clipboard', Icon: ClipboardIcon },
  { name: 'CloseMenu', Icon: CloseMenuIcon },
  { name: 'CodeBlock', Icon: CodeBlockIcon },
  { name: 'Copy', Icon: CopyIcon },
  { name: 'Document', Icon: DocumentIcon },
  { name: 'Duplicate', Icon: DuplicateIcon },
  { name: 'Edit', Icon: EditIcon },
  { name: 'ExternalLink', Icon: ExternalLinkIcon },
  { name: 'Eye', Icon: EyeIcon },
  { name: 'Filter', Icon: FilterIcon },
  { name: 'Folder', Icon: FolderIcon },
  { name: 'Gear', Icon: GearIcon },
  { name: 'GridView', Icon: GridViewIcon },
  { name: 'Line', Icon: LineIcon },
  { name: 'Link', Icon: LinkIcon },
  { name: 'Lock', Icon: LockIcon },
  { name: 'LockOpen', Icon: LockOpenIcon },
  { name: 'LogOut', Icon: LogOutIcon },
  { name: 'More', Icon: MoreIcon },
  { name: 'MoveFolder', Icon: MoveFolderIcon },
  { name: 'People', Icon: PeopleIcon },
  { name: 'Refresh', Icon: RefreshIcon },
  { name: 'Search', Icon: SearchIcon },
  { name: 'SortDown', Icon: SortDownIcon },
  { name: 'Spinner', Icon: SpinnerIcon },
  { name: 'Swap', Icon: SwapIcon },
  { name: 'Tag', Icon: TagIcon },
  { name: 'ThreeDots', Icon: ThreeDotsIcon },
  { name: 'Trash', Icon: TrashIcon },
  { name: 'Write', Icon: WriteIcon },
]

export const IconsSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="icons" selectedComponent={selectedComponent} title="Icons">
    <div className="components-view__icon-grid">
      {/* Variant: Chevron direction */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Chevron</span>
        <div className="components-view__icon-variants">
          <ChevronIcon direction="down" />
          <ChevronIcon direction="up" />
          <ChevronIcon direction="left" />
          <ChevronIcon direction="right" />
        </div>
        <div className="components-view__icon-size-row">
          <span>lg</span>
          <ChevronIcon direction="down" large />
        </div>
      </div>

      {/* Variant: MinimizeMaximize */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>MinimizeMaximize</span>
        <div className="components-view__icon-variants">
          <MinimizeMaximizeIcon isMinimized={false} />
          <MinimizeMaximizeIcon isMinimized />
        </div>
      </div>

      {/* Variant: Plus sizes */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Plus</span>
        <div className="components-view__icon-size-row">
          <span>16</span>
          <PlusIcon size={16} />
        </div>
        <div className="components-view__icon-size-row">
          <span>24</span>
          <PlusIcon size={24} />
        </div>
      </div>

      {/* Variant: X sizes */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>X</span>
        <div className="components-view__icon-size-row">
          <span>16</span>
          <XIcon size={16} />
        </div>
        <div className="components-view__icon-size-row">
          <span>24</span>
          <XIcon size={24} />
        </div>
      </div>

      {/* Variant: Line sizes */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Line</span>
        <div className="components-view__icon-size-row">
          <span>16</span>
          <LineIcon size={16} />
        </div>
        <div className="components-view__icon-size-row">
          <span>24</span>
          <LineIcon size={24} />
        </div>
      </div>

      {/* All other icons */}
      {icons.map(({ name, Icon }) => (
        <div className="components-view__icon-item" key={name}>
          <span>{name}</span>
          <Icon />
        </div>
      ))}
    </div>
  </Section>
)
