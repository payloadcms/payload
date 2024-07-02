'use client'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'

import { AIIcon } from '../../lexical/ui/icons/AI/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { slashMenuBasicGroupWithItems } from '../shared/slashMenu/basicGroup.js'
import { toolbarAddDropdownGroupWithItems } from '../shared/toolbar/addDropdownGroup.js'
import { TableActionMenuPlugin } from './plugins/TableActionMenuPlugin/index.js'
import { TableCellResizerPlugin } from './plugins/TableCellResizerPlugin/index.js'
import {
  OPEN_TABLE_DRAWER_COMMAND,
  TableContext,
  TablePlugin,
} from './plugins/TablePlugin/index.js'

export const TableFeatureClient = createClientFeature({
  nodes: [TableNode, TableCellNode, TableRowNode],
  plugins: [
    {
      Component: TablePlugin,
      position: 'normal',
    },
    {
      Component: TableCellResizerPlugin,
      position: 'normal',
    },
    {
      Component: TableActionMenuPlugin,
      position: 'floatingAnchorElem',
    },
  ],
  providers: [TableContext],
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: AIIcon,
          key: 'table',
          keywords: ['table'],
          label: 'Table',
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_TABLE_DRAWER_COMMAND, {})
          },
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: [
      toolbarAddDropdownGroupWithItems([
        {
          key: 'table',
          label: 'Table',
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_TABLE_DRAWER_COMMAND, {})
          },
        },
      ]),
    ],
  },
})
