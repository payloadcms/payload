import type {
  ClientField,
  DefaultCellComponentProps,
  Field,
  ImportMap,
  PaginatedDocs,
} from 'payload'

import { generateFieldKey } from 'payload'

import type { RenderedCells } from '../elements/Table/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { SortColumn } from '../elements/SortColumn/index.js'
import { DefaultCell } from '../elements/Table/DefaultCell/index.js'

export const renderCells = ({
  clientFields,
  collectionSlug,
  data,
  fields,
  importMap,
}: {
  clientFields: ClientField[]
  collectionSlug: string
  data: PaginatedDocs
  fields: Field[]
  importMap: ImportMap
}): RenderedCells => {
  const result = {
    cells: new Map<string, React.ReactNode>(),
    headings: new Map<string, React.ReactNode>(),
  }

  data.docs.forEach((doc, rowIndex) => {
    fields.forEach((field, fieldIndex) => {
      const fieldKey = generateFieldKey({
        path: 'name' in field ? `${field.name}.${rowIndex}` : undefined,
        schemaIndex: fieldIndex,
      })

      const headingKey = generateFieldKey({
        path: 'name' in field ? field.name : undefined,
        schemaIndex: fieldIndex,
      })

      if (!result.headings.has(headingKey)) {
        const FieldHeading = <SortColumn />

        result.headings.set(headingKey, FieldHeading)
      }

      const clientField = clientFields?.[fieldIndex]

      const clientProps: DefaultCellComponentProps = {
        cellData: 'name' in field && doc[field.name],
        columnIndex: fieldIndex, // TODO: this is not right
        customCellContext: {
          collectionSlug,
          uploadConfig: clientField?.type === 'upload' && clientField?.admin?.upload,
        },
        field: clientField,
        rowData: doc,
      }

      const RenderedCell = (
        <RenderServerComponent
          clientProps={clientProps}
          Component={field?.admin?.components?.Cell}
          Fallback={DefaultCell}
          importMap={importMap}
          serverProps={{
            ...clientProps,
            clientField,
            field,
          }}
        />
      )

      result.cells.set(fieldKey, RenderedCell)
    })
  })

  return result
}
