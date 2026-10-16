import type {
  FieldDiffServerProps,
  TextFieldDiffClientComponent,
  TextFieldDiffClientProps,
  TextFieldDiffServerProps,
} from 'payload'
import type React from 'react'

export const Destructured: React.FC<TextFieldDiffClientProps> = ({
  comparisonValue,
  field,
  versionValue,
}) => {
  const hasChanged = comparisonValue !== versionValue
  return hasChanged ? `${String(comparisonValue)} -> ${String(versionValue)}` : field.name
}

export const LegacyComponentType: TextFieldDiffClientComponent = ({
  comparisonValue,
  versionValue = '',
}) => `${String(comparisonValue)} -> ${String(versionValue)}`

export const Aliased = ({
  comparisonValue: before,
  versionValue: valueTo,
}: TextFieldDiffClientProps) => [before, valueTo]

export default async function PropsObject(props: TextFieldDiffServerProps) {
  const { comparisonValue, req } = props
  return [comparisonValue, props.versionValue, props['comparisonValue'], req.locale]
}

type PropsWithLabel = { label: string } & TextFieldDiffClientProps

export function LocalPropsType({ label, versionValue }: PropsWithLabel) {
  return [label, versionValue]
}

export const RestProps = ({ field, ...rest }: FieldDiffServerProps) => [field, rest.comparisonValue]

export const NameCollision = ({ comparisonValue }: TextFieldDiffClientProps) => {
  const valueFrom = 'unrelated'
  return [comparisonValue, valueFrom]
}

export const formatValue = (value: TextFieldDiffClientProps['versionValue']) => String(value)
