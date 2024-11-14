import { SelectField } from '../../fields/Select/index.js'

export const LocaleSelectField: React.FC<{
  label: string
  name: string
  onChange: (value: string) => void
  options: { label: Record<string, string> | string; value: string }[]
  value: null | string
}> = ({ name, label, onChange, options, value }) => (
  <SelectField
    field={{ name, label, options }}
    onChange={(val: string) => onChange(val)}
    path={name}
    value={value}
  />
)
