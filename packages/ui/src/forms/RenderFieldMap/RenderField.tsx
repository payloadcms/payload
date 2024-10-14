'use client'
import type { FormField } from 'payload'
import type React from 'react'

import { useState } from 'react'

export const RenderField: React.FC<{
  fieldState: FormField
}> = ({ fieldState }) => {
  // Put the field in state to avoid losing it on re-renders
  // This is bc `buildFormField` only recreates fields that have changed, not the entire form state
  // This means that if a field is removed from the form state, it will not be recreated
  // And we _do_ remove fields before sending form state back to the server, to comply with Server Action rules
  // There might be a way to do this natively, through what they call a "TemporaryReferenceSet" but there's no docs into this API
  // Here's the error: "React Element cannot be passed to Server Functions from the Client without a temporary reference set. Pass a TemporaryReferenceSet to the options."
  const [Field] = useState(fieldState?.Field)
  return Field
}
