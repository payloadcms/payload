import type {
  FieldDiffServerProps,
  TextFieldDiffClientComponent,
  TextFieldDiffClientProps,
  TextFieldDiffServerProps,
} from 'payload'
import type React from 'react'

export const Destructured: React.FC<TextFieldDiffClientProps> = ({
  valueFrom,
  field,
  valueTo,
}) => {
  const hasChanged = valueFrom !== valueTo
  return hasChanged ? `${String(valueFrom)} -> ${String(valueTo)}` : field.name
}

export const LegacyComponentType: TextFieldDiffClientComponent = ({
  valueFrom,
  valueTo = '',
}) => `${String(valueFrom)} -> ${String(valueTo)}`

export const Aliased = ({
  valueFrom: before,
  valueTo,
}: TextFieldDiffClientProps) => [before, valueTo]

export default async function PropsObject(props: TextFieldDiffServerProps) {
  const { valueFrom, req } = props
  return [valueFrom, props.valueTo, props['valueFrom'], req.locale]
}

type PropsWithLabel = { label: string } & TextFieldDiffClientProps

export function LocalPropsType({ label, valueTo }: PropsWithLabel) {
  return [label, valueTo]
}

export const RestProps = ({ field, ...rest }: FieldDiffServerProps) => [field, rest.valueFrom]

export const NameCollision = ({ valueFrom: comparisonValue }: TextFieldDiffClientProps) => {
  const valueFrom = 'unrelated'
  return [comparisonValue, valueFrom]
}

export const formatValue = (value: TextFieldDiffClientProps['valueTo']) => String(value)
