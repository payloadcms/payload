import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientField,
  DefaultCellComponentProps,
  DefaultServerCellComponentProps,
  Field,
  Payload,
} from 'payload'

import { MissingEditorProp } from 'payload'

import { RenderCustomComponent } from '../../../elements/RenderCustomComponent/index.js'
import { RenderServerComponent } from '../../../elements/RenderServerComponent/index.js'
import { DefaultCell } from '../../../elements/Table/DefaultCell/index.js'
import { hasOptionLabelJSXElement } from '../../../utilities/hasOptionLabelJSXElement.js'
import { RenderDefaultCell } from '../RenderDefaultCell/index.js'

type RenderCellArgs = {
  readonly clientField: ClientField
  readonly collectionSlug: string
  readonly columnIndex: number
  readonly customCellProps: DefaultCellComponentProps['customCellProps']
  readonly doc: any
  readonly enableRowSelections: boolean
  readonly i18n: I18nClient
  readonly isLinkedColumn: boolean
  readonly payload: Payload
  readonly rowIndex: number
  readonly serverField: Field
}
export function renderCell({
  clientField,
  collectionSlug,
  columnIndex,
  customCellProps,
  doc,
  enableRowSelections,
  i18n,
  isLinkedColumn,
  payload,
  rowIndex,
  serverField,
}: RenderCellArgs) {
  const baseCellClientProps: DefaultCellComponentProps = {
    cellData: undefined,
    collectionSlug,
    customCellProps,
    field: clientField,
    rowData: undefined,
  }

  const cellClientProps: DefaultCellComponentProps = {
    ...baseCellClientProps,
    cellData: 'name' in clientField ? doc[clientField.name] : undefined,
    link: isLinkedColumn,
    rowData: doc,
  }

  const cellServerProps: DefaultServerCellComponentProps = {
    cellData: cellClientProps.cellData,
    className: baseCellClientProps.className,
    collectionConfig: payload.collections[collectionSlug].config,
    collectionSlug,
    columnIndex,
    customCellProps: baseCellClientProps.customCellProps,
    field: serverField,
    i18n,
    link: cellClientProps.link,
    onClick: baseCellClientProps.onClick,
    payload,
    rowData: doc,
  }

  let CustomCell = null

  if (serverField?.type === 'richText') {
    if (!serverField?.editor) {
      throw new MissingEditorProp(serverField) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
    }

    if (typeof serverField?.editor === 'function') {
      throw new Error('Attempted to access unsanitized rich text editor.')
    }

    if (!serverField.admin) {
      serverField.admin = {}
    }

    if (!serverField.admin.components) {
      serverField.admin.components = {}
    }

    CustomCell = RenderServerComponent({
      clientProps: cellClientProps,
      Component: serverField.editor.CellComponent,
      importMap: payload.importMap,
      serverProps: cellServerProps,
    })
  } else {
    const CustomCellComponent = serverField?.admin?.components?.Cell

    if (CustomCellComponent) {
      CustomCell = RenderServerComponent({
        clientProps: cellClientProps,
        Component: CustomCellComponent,
        importMap: payload.importMap,
        serverProps: cellServerProps,
      })
    } else if (
      cellClientProps.cellData &&
      cellClientProps.field &&
      hasOptionLabelJSXElement(cellClientProps)
    ) {
      CustomCell = RenderServerComponent({
        clientProps: cellClientProps,
        Component: DefaultCell,
        importMap: payload.importMap,
      })
    } else {
      const CustomCellComponent = serverField?.admin?.components?.Cell

      if (CustomCellComponent) {
        CustomCell = RenderServerComponent({
          clientProps: cellClientProps,
          Component: CustomCellComponent,
          importMap: payload.importMap,
          serverProps: cellServerProps,
        })
      } else {
        CustomCell = undefined
      }
    }
  }

  return (
    <RenderCustomComponent
      CustomComponent={CustomCell}
      Fallback={
        <RenderDefaultCell
          clientProps={cellClientProps}
          columnIndex={columnIndex}
          enableRowSelections={enableRowSelections}
          isLinkedColumn={isLinkedColumn}
        />
      }
      key={`${rowIndex}-${columnIndex}`}
    />
  )
}
