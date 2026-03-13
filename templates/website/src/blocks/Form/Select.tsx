import type { SelectField } from '@payloadcms/plugin-form-builder/types'
import { Controller, type Control, type FieldErrorsImpl } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { countryOptions } from './options/countries'
import { stateOptions } from './options/states'
import { Error } from './Error'
import { Width } from './Width'

const predefinedOptions = {
  country: countryOptions,
  state: stateOptions,
}

export const Select: React.FC<
  SelectField & {
    control: Control
    errors: Partial<FieldErrorsImpl>
    type?: 'default' | 'country' | 'state'
  }
> = ({
  name,
  control,
  errors,
  label,
  required,
  width,
  options,
  defaultValue,
  type = 'default',
}) => {
  const resolvedOptions = type !== 'default' ? predefinedOptions[type] : options

  return (
    <Width width={width}>
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="required">
            * <span className="sr-only">(required)</span>
          </span>
        )}
      </Label>
      <Controller
        control={control}
        defaultValue={type !== 'default' ? '' : defaultValue}
        name={name}
        render={({ field: { onChange, value } }) => {
          const controlledValue = resolvedOptions.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger className="w-full" id={name}>
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {resolvedOptions.map(({ label, value }) => {
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </SelectComponent>
          )
        }}
        rules={{ required }}
      />
      {errors[name] && <Error name={name} />}
    </Width>
  )
}
