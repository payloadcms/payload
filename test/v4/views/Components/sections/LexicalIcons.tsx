'use client'

import React from 'react'

import { AddIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Add/index.js'
import { AlignCenterIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/AlignCenter/index.js'
import { AlignJustifyIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/AlignJustify/index.js'
import { AlignLeftIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/AlignLeft/index.js'
import { AlignRightIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/AlignRight/index.js'
import { BlockIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Block/index.js'
import { BlockquoteIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Blockquote/index.js'
import { BoldIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Bold/index.js'
import { ChecklistIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Checklist/index.js'
import { CodeIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Code/index.js'
import { CodeBlockIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/CodeBlock/index.js'
import { CollapseIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Collapse/index.js'
import { ExpandIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Expand/index.js'
import { H1Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H1/index.js'
import { H2Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H2/index.js'
import { H3Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H3/index.js'
import { H4Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H4/index.js'
import { H5Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H5/index.js'
import { H6Icon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/H6/index.js'
import { HorizontalRuleIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/HorizontalRule/index.js'
import { IndentDecreaseIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/IndentDecrease/index.js'
import { IndentIncreaseIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/IndentIncrease/index.js'
import { InlineBlocksIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/InlineBlocks/index.js'
import { ItalicIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Italic/index.js'
import { LinkIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Link/index.js'
import { MeatballsIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Meatballs/index.js'
import { OrderedListIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/OrderedList/index.js'
import { RelationshipIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Relationship/index.js'
import { StrikethroughIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Strikethrough/index.js'
import { SubscriptIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Subscript/index.js'
import { SuperscriptIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Superscript/index.js'
import { TableIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Table/index.js'
import { TextIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Text/index.js'
import { TextStateIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/TextState/index.js'
import { TrashIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Trash/index.js'
import { UnderlineIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Underline/index.js'
import { UnorderedListIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/UnorderedList/index.js'
import { UploadIcon } from '../../../../../packages/richtext-lexical/src/lexical/ui/icons/Upload/index.js'
import { Section } from '../shared.js'

const icons = [
  { name: 'AlignCenter', Icon: AlignCenterIcon },
  { name: 'AlignJustify', Icon: AlignJustifyIcon },
  { name: 'AlignLeft', Icon: AlignLeftIcon },
  { name: 'AlignRight', Icon: AlignRightIcon },
  { name: 'Block', Icon: BlockIcon },
  { name: 'Blockquote', Icon: BlockquoteIcon },
  { name: 'Bold', Icon: BoldIcon },
  { name: 'Code', Icon: CodeIcon },
  { name: 'Collapse', Icon: CollapseIcon },
  { name: 'Expand', Icon: ExpandIcon },
  { name: 'H1', Icon: H1Icon },
  { name: 'H2', Icon: H2Icon },
  { name: 'H3', Icon: H3Icon },
  { name: 'H4', Icon: H4Icon },
  { name: 'H5', Icon: H5Icon },
  { name: 'H6', Icon: H6Icon },
  { name: 'HorizontalRule', Icon: HorizontalRuleIcon },
  { name: 'IndentDecrease', Icon: IndentDecreaseIcon },
  { name: 'IndentIncrease', Icon: IndentIncreaseIcon },
  { name: 'InlineBlocks', Icon: InlineBlocksIcon },
  { name: 'Italic', Icon: ItalicIcon },
  { name: 'Relationship', Icon: RelationshipIcon },
  { name: 'Strikethrough', Icon: StrikethroughIcon },
  { name: 'Subscript', Icon: SubscriptIcon },
  { name: 'Superscript', Icon: SuperscriptIcon },
  { name: 'TextState', Icon: TextStateIcon },
  { name: 'Underline', Icon: UnderlineIcon },
  { name: 'UnorderedList', Icon: UnorderedListIcon },
  { name: 'Upload', Icon: UploadIcon },
]

export const LexicalIconsSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section
    columns={1}
    id="lexical-icons"
    selectedComponent={selectedComponent}
    title="Lexical Icons"
  >
    <div className="components-view__icon-grid">
      {/* Add - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Add</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <AddIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <AddIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Checklist</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <ChecklistIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <ChecklistIcon size={16} />
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

      {/* Meatballs - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Meatballs</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <MeatballsIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <MeatballsIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* OrderedList - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>OrderedList</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <OrderedListIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <OrderedListIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Table - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Table</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <TableIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <TableIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Text - size */}
      <div className="components-view__icon-item components-view__icon-item--variants">
        <span>Text</span>
        <div className="components-view__icon-content">
          <div className="components-view__icon-size-row">
            <span>size: 24 (default)</span>
            <div className="components-view__icon-variants">
              <TextIcon size={24} />
            </div>
          </div>
          <div className="components-view__icon-size-row">
            <span>size: 16</span>
            <div className="components-view__icon-variants">
              <TextIcon size={16} />
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
