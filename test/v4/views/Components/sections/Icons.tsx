'use client'

import { AlignJustifiedIcon, ArrowIcon, CalendarIcon, CheckIcon, ChevronIcon, CircledXIcon, CirclePlusIcon, ClipboardIcon, CloseMenuIcon, CodeBlockIcon, CopyIcon, DocumentIcon, DuplicateIcon, EditIcon, EyeIcon, FilterIcon, FolderIcon, GearIcon, GridViewIcon, LineIcon, LinkIcon, LockIcon, LockOpenIcon, LogOutIcon, MinimizeMaximizeIcon, MoreIcon, MoveFolderIcon, NewTabIcon, PeopleIcon, PlusIcon, RefreshIcon, SearchIcon, SortDownIcon, SpinnerIcon, SwapIcon, TagIcon, ThreeDotsIcon, TrashIcon, WriteIcon, XIcon } from '@payloadcms/ui'
import React from 'react'

import { Section } from '../shared.js'

const icons = [
  { name: 'Calendar', Icon: CalendarIcon },
  { name: 'Clipboard', Icon: ClipboardIcon },
  { name: 'Document', Icon: DocumentIcon },
  { name: 'Duplicate', Icon: DuplicateIcon },
  { name: 'Edit', Icon: EditIcon },
  { name: 'Filter', Icon: FilterIcon },
  { name: 'Gear', Icon: GearIcon },
  { name: 'GridView', Icon: GridViewIcon },
  { name: 'LogOut', Icon: LogOutIcon },
  { name: 'More', Icon: MoreIcon },
  { name: 'Refresh', Icon: RefreshIcon },
  { name: 'Search', Icon: SearchIcon },
  { name: 'SortDown', Icon: SortDownIcon },
  { name: 'Swap', Icon: SwapIcon },
  { name: 'ThreeDots', Icon: ThreeDotsIcon },
  { name: 'Write', Icon: WriteIcon },
]

export const IconsSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section columns={1} id="icons" selectedComponent={selectedComponent} title="Icons">
    <div className="components-view__icon-grid">
      {/* Chevron - direction + size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Chevron</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <ChevronIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <ChevronIcon size={16} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>direction: down (default)</span>
            <div className="components-view__icon-variants">
              <ChevronIcon direction="down" />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>direction: down (default) | up | left | right</span>
            <div className="components-view__icon-variants">
              <ChevronIcon />
              <ChevronIcon direction="up" />
              <ChevronIcon direction="left" />
              <ChevronIcon direction="right" />
            </div>
          </div>
        </div>
      </div>

      {/* Arrow - direction + size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Arrow</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>direction: up (default)</span>
            <div className="components-view__icon-variants">
              <ArrowIcon direction="up" />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>direction: down</span>
            <div className="components-view__icon-variants">
              <ArrowIcon direction="down" />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <ArrowIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <ArrowIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* MinimizeMaximize - isMinimized */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>MinimizeMaximize</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>isMinimized: false (default)</span>
            <div className="components-view__icon-variants">
              <MinimizeMaximizeIcon isMinimized={false} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>isMinimized: true</span>
            <div className="components-view__icon-variants">
              <MinimizeMaximizeIcon isMinimized />
            </div>
          </div>
        </div>
      </div>

      {/* Eye - active */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Eye</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>active: true (default, hidden)</span>
            <div className="components-view__icon-variants">
              <EyeIcon active />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>active: false (visible)</span>
            <div className="components-view__icon-variants">
              <EyeIcon active={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Spinner - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Spinner</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: sm (16px)</span>
            <div className="components-view__icon-variants">
              <SpinnerIcon size="sm" />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: md (24px small arc)</span>
            <div className="components-view__icon-variants">
              <SpinnerIcon size="md" />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: lg (24px large arc)</span>
            <div className="components-view__icon-variants">
              <SpinnerIcon size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Plus - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Plus</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <PlusIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <PlusIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* X - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>X</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 16 (default)</span>
            <div className="components-view__icon-variants">
              <XIcon size={16} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 24</span>
            <div className="components-view__icon-variants">
              <XIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Line - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Line</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <LineIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <LineIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Check - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Check</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 16 (default)</span>
            <div className="components-view__icon-variants">
              <CheckIcon size={16} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 24</span>
            <div className="components-view__icon-variants">
              <CheckIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* CircledX - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>CircledX</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 16 (default)</span>
            <div className="components-view__icon-variants">
              <CircledXIcon size={16} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 24</span>
            <div className="components-view__icon-variants">
              <CircledXIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* CirclePlus - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>CirclePlus</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <CirclePlusIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <CirclePlusIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* CloseMenu - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>CloseMenu</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <CloseMenuIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <CloseMenuIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* CodeBlock - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>CodeBlock</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <CodeBlockIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <CodeBlockIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Copy - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Copy</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <CopyIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <CopyIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* NewTab - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>NewTab</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <NewTabIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <NewTabIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Folder - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Folder</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <FolderIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <FolderIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Link - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Link</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <LinkIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <LinkIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Lock - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Lock</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <LockIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <LockIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* LockOpen - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>LockOpen</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <LockOpenIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <LockOpenIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* MoveFolder - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>MoveFolder</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <MoveFolderIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <MoveFolderIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* People - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>People</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <PeopleIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <PeopleIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Tag - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Tag</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <TagIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <TagIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* AlignJustified - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>AlignJustified</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 16 (default)</span>
            <div className="components-view__icon-variants">
              <AlignJustifiedIcon size={16} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 24</span>
            <div className="components-view__icon-variants">
              <AlignJustifiedIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Trash - small */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Trash</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>default</span>
            <div className="components-view__icon-variants">
              <TrashIcon />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>small: true</span>
            <div className="components-view__icon-variants">
              <TrashIcon small />
            </div>
          </div>
        </div>
      </div>

      {/* Icons without variants */}
      {icons.map(({ name, Icon }) => (
        <div className="components-view__icon-item" key={name}>
          <span>{name}</span>
          <Icon />
        </div>
      ))}
    </div>
  </Section>
)
