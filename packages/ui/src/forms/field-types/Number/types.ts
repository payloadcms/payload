import type { NumberField } from 'payload/types'
import { FormFieldBase } from '../Text/types'

export type Props = FormFieldBase & Omit<NumberField, 'type'>
