import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientField,
  DefaultCellComponentProps,
  DefaultServerCellComponentProps,
  Document,
  Field,
  Payload,
  PayloadRequest,
  ViewTypes,
} from 'payload'

import { MissingEditorProp } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { RenderCustomComponent } from '../../../elements/RenderCustomComponent/index.js'
import { RenderServerComponent } from '../../../elements/RenderServerComponent/index.js'
import {
  DefaultCell,
  RenderDefaultCell,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- MUST reference the exports dir: https://github.com/payloadcms/payload/issues/12002#issuecomment-2791493587
} from '../../../exports/client/index.js'
import { hasOptionLabelJSXElement } from '../../../utilities/hasOptionLabelJSXElement.js'
import { findValueFromPath } from './findValueFromPath.js'

type RenderCellArgs = {
  readonly clientField: ClientField
  readonly collectionSlug: string
  readonly columnIndex: number
  readonly customCellProps: DefaultCellComponentProps['customCellProps']
  readonly doc: Document
  readonly enableRowSelections: boolean
  readonly i18n: I18nClient
  readonly isLinkedColumn: boolean
  readonly payload: Payload
  readonly req?: PayloadRequest
  readonly rowIndex: number
  readonly serverField: Field
  readonly viewType?: ViewTypes
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
  req,
  rowIndex,
  serverField,
  viewType,
}: RenderCellArgs) {
  const baseCellClientProps: DefaultCellComponentProps = {
    cellData: undefined,
    collectionSlug,
    customCellProps,
    field: clientField,
    rowData: undefined,
    viewType,
  }

  const accessor: string | undefined =
    ('accessor' in clientField ? (clientField.accessor as string) : undefined) ??
    ('name' in clientField ? clientField.name : undefined)

  // Check if there's a custom formatDocURL function for this linked column
  let shouldLink = isLinkedColumn
  let customLinkURL: string | undefined

  if (isLinkedColumn && req) {
    const collectionConfig = payload.collections[collectionSlug]?.config
    const formatDocURL = collectionConfig?.admin?.formatDocURL

    if (typeof formatDocURL === 'function') {
      // Generate the default URL that would normally be used
      const adminRoute = req.payload.config.routes?.admin || '/admin'
      const defaultURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}${viewType === 'trash' ? '/trash' : ''}/${encodeURIComponent(String(doc.id))}`,
      })

      const customURL = formatDocURL({
        collectionSlug,
        defaultURL,
        doc,
        req,
        viewType,
      })

      if (customURL === null) {
        // formatDocURL returned null = disable linking entirely
        shouldLink = false
      } else if (typeof customURL === 'string') {
        // formatDocURL returned a string = use custom URL
        shouldLink = true
        customLinkURL = customURL
      } else {
        // formatDocURL returned unexpected type = disable linking for safety
        shouldLink = false
      }
    }
  }

  const cellClientProps: DefaultCellComponentProps = {
    ...baseCellClientProps,
    cellData: 'name' in clientField ? findValueFromPath(doc, accessor) : undefined,
    link: shouldLink,
    linkURL: customLinkURL,
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
    link: shouldLink,
    linkURL: customLinkURL,
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
