import type { Field } from 'payload'
import { Button } from '@payloadcms/ui'

import { formatAdminURL } from 'payload/shared'

export const Thing = (props: { field: Field }) => Button
export const url = formatAdminURL
