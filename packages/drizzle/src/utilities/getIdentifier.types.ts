export type SchemaOwner = 'enum' | 'index' | 'table'
export type TableOwner = 'column' | 'fk'
export type IdentifierType = SchemaOwner | TableOwner

export type IdentifierProps = ({ customName: string } | { segments: string[]; suffix?: string }) &
  ({ parentTable: string; type: TableOwner } | { type: SchemaOwner })

export type GetIdentifier = (props: IdentifierProps) => string

export type IdentifierTrackers = {
  columnsByTable: Map<string, Map<string, IdentifierType>>
  fksByTable: Map<string, Map<string, IdentifierType>>
  schema: Map<string, IdentifierType>
}
