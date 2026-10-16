'use client'

import { AlignJustifiedIcon, ArrowIcon, CalendarIcon, CheckIcon, ChevronIcon, CircledXIcon, CirclePlusIcon, ClipboardIcon, CloseMenuIcon, CodeBlockIcon, CopyIcon, DocumentIcon, Dots, DuplicateIcon, EditIcon, EyeIcon, FolderIcon, GearIcon, GridViewIcon, LineIcon, LinkIcon, LockIcon, LogOutIcon, MinimizeMaximizeIcon, MoreIcon, MoveFolderIcon, NewTabIcon, PeopleIcon, PlusIcon, SearchIcon, SortDownIcon, SortUpIcon, SwapIcon, ThreeDotsIcon, TrashIcon, WriteIcon, XIcon } from '@payloadcms/ui'
import Link from 'next/link'

import './index.css'

import React from 'react'

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
    name: 'NewTabIcon',
    render: (size) => <NewTabIcon size={size} />,
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
  {
    name: 'TrashIcon',
    render: () => (
      <>
        <TrashIcon />
        <TrashIcon small />
      </>
    ),
  },
  { name: 'WriteIcon', render: () => <WriteIcon /> },
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
