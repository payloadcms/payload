import type { Field, TextFieldClientProps } from 'payload'

type Comparison = { comparisonValue: unknown; versionValue: unknown }

export const isUnchanged = ({ comparisonValue, versionValue }: Comparison) =>
  comparisonValue === versionValue

export const TextField = (props: TextFieldClientProps & Comparison) => props.versionValue

export const versionValueField: Field = { name: 'versionValue', type: 'text' }
