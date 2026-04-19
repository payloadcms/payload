export type SchemaOwner = 'enum' | 'index' | 'table'
export type TableOwner = 'column' | 'fk'
export type IdentifierType = SchemaOwner | TableOwner

export type IdentifierProps = ({ parentTable: string; type: TableOwner } | { type: SchemaOwner }) &
  ({ customName: string; suffix?: string } | { segments: string[]; suffix?: string })

export type GetIdentifier = (props: IdentifierProps) => string

export type IdentifierTrackers = {
  columnsByTable: Map<string, Map<string, TableOwner>>
  fksByTable: Map<string, Map<string, TableOwner>>
  schema: Map<string, SchemaOwner>
}
