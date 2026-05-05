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
import { Dots } from '@payloadcms/ui/icons/Dots'
import { DuplicateIcon } from '@payloadcms/ui/icons/Duplicate'
import { EditIcon } from '@payloadcms/ui/icons/Edit'
import { ExternalLinkIcon } from '@payloadcms/ui/icons/ExternalLink'
import { EyeIcon } from '@payloadcms/ui/icons/Eye'
import { FolderIcon } from '@payloadcms/ui/icons/Folder'
import { GearIcon } from '@payloadcms/ui/icons/Gear'
import { GridViewIcon } from '@payloadcms/ui/icons/GridView'
import { LineIcon } from '@payloadcms/ui/icons/Line'
import { LinkIcon } from '@payloadcms/ui/icons/Link'
import { LockIcon } from '@payloadcms/ui/icons/Lock'
import { LogOutIcon } from '@payloadcms/ui/icons/LogOut'
import { MinimizeMaximizeIcon } from '@payloadcms/ui/icons/MinimizeMaximize'
import { MoreIcon } from '@payloadcms/ui/icons/More'
import { MoveFolderIcon } from '@payloadcms/ui/icons/MoveFolder'
import { PeopleIcon } from '@payloadcms/ui/icons/People'
import { PlusIcon } from '@payloadcms/ui/icons/Plus'
import { SearchIcon } from '@payloadcms/ui/icons/Search'
import { SortDownIcon, SortUpIcon } from '@payloadcms/ui/icons/Sort'
import { SwapIcon } from '@payloadcms/ui/icons/Swap'
import { ThreeDotsIcon } from '@payloadcms/ui/icons/ThreeDots'
import { TrashIcon } from '@payloadcms/ui/icons/Trash'
import { XIcon } from '@payloadcms/ui/icons/X'
import Link from 'next/link'
import React from 'react'

import './index.css'

type IconEntry = {
  name: string
  render: (size?: 16 | 24) => React.ReactNode
  sizes?: (16 | 24)[]
}

const icons: IconEntry[] = [
  // Multi-size icons with direction
  {
    name: 'ArrowIcon (up)',
    render: (size) => <ArrowIcon direction="up" size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ArrowIcon (down)',
    render: (size) => <ArrowIcon direction="down" size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ChevronIcon (down)',
    render: (size) => <ChevronIcon direction="down" size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ChevronIcon (down, large)',
    render: () => <ChevronIcon direction="down" large size={24} />,
    sizes: [24],
  },
  {
    name: 'ChevronIcon (up)',
    render: (size) => <ChevronIcon direction="up" size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ChevronIcon (left)',
    render: (size) => <ChevronIcon direction="left" size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ChevronIcon (right)',
    render: (size) => <ChevronIcon direction="right" size={size} />,
    sizes: [16, 24],
  },

  // Multi-size icons
  {
    name: 'CirclePlusIcon',
    render: (size) => <CirclePlusIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'CircledXIcon',
    render: (size) => <CircledXIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'DocumentIcon',
    render: (size) => <DocumentIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'DuplicateIcon',
    render: (size) => <DuplicateIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'ExternalLinkIcon',
    render: (size) => <ExternalLinkIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'LogOutIcon',
    render: (size) => <LogOutIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'MinimizeMaximizeIcon',
    render: (size) => <MinimizeMaximizeIcon size={size} />,
    sizes: [16, 24],
  },
  {
    name: 'MoveFolderIcon',
    render: (size) => <MoveFolderIcon size={size} />,
    sizes: [16, 24],
  },

  // 24px only icons
  { name: 'CalendarIcon', render: () => <CalendarIcon /> },
  { name: 'ClipboardIcon', render: () => <ClipboardIcon /> },
  { name: 'CloseMenuIcon', render: () => <CloseMenuIcon /> },
  { name: 'CodeBlockIcon', render: () => <CodeBlockIcon /> },
  { name: 'CopyIcon', render: () => <CopyIcon /> },
  { name: 'AlignJustifiedIcon', render: () => <AlignJustifiedIcon /> },
  { name: 'EditIcon', render: () => <EditIcon /> },
  { name: 'EyeIcon', render: () => <EyeIcon /> },
  { name: 'FolderIcon', render: () => <FolderIcon /> },
  { name: 'GearIcon', render: () => <GearIcon /> },
  { name: 'GridViewIcon', render: () => <GridViewIcon /> },
  { name: 'LineIcon', render: () => <LineIcon /> },
  { name: 'LinkIcon', render: () => <LinkIcon /> },
  { name: 'LockIcon', render: () => <LockIcon /> },
  { name: 'MoreIcon', render: () => <MoreIcon /> },
  { name: 'PeopleIcon', render: () => <PeopleIcon /> },
  { name: 'PlusIcon', render: () => <PlusIcon /> },
  { name: 'SearchIcon', render: () => <SearchIcon /> },
  { name: 'SortDownIcon', render: () => <SortDownIcon /> },
  { name: 'SortUpIcon', render: () => <SortUpIcon /> },
  { name: 'SwapIcon', render: () => <SwapIcon /> },
  { name: 'TrashIcon', render: () => <TrashIcon /> },
  { name: 'XIcon', render: () => <XIcon /> },

  // Special icons
  { name: 'CheckIcon', render: () => <CheckIcon /> },
  {
    name: 'Dots (vertical)',
    render: () => <Dots orientation="vertical" />,
  },
  {
    name: 'Dots (horizontal)',
    render: () => <Dots orientation="horizontal" />,
  },
  { name: 'ThreeDotsIcon', render: () => <ThreeDotsIcon /> },
]

export const IconsView: React.FC = () => {
  return (
    <div className="icons-view">
      <div className="icons-view__header">
        <Link className="icons-view__back" href="/admin">
          <ChevronIcon direction="left" size={16} />
          Back to Dashboard
        </Link>
        <h1>Icon Gallery</h1>
        <p className="icons-view__description">
          All icons from <code>@payloadcms/ui</code>. Icons with multiple sizes show both 16px and
          24px variants.
        </p>
      </div>

      <div className="icons-view__grid">
        {icons.map((icon) => (
          <div className="icons-view__item" key={icon.name}>
            <div className="icons-view__icon-row">
              {icon.sizes ? (
                icon.sizes.map((size) => (
                  <div className="icons-view__icon-wrapper" key={size}>
                    {icon.render(size)}
                    <span className="icons-view__size">{size}px</span>
                  </div>
                ))
              ) : (
                <div className="icons-view__icon-wrapper">{icon.render()}</div>
              )}
            </div>
            <span className="icons-view__name">{icon.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IconsView
