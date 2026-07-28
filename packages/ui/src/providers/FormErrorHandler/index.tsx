'use client'
import { createContext, use } from 'react'

export type NonFieldError = {
  data?: unknown
  message: string
}

/**
 * A callback that a plugin can provide to intercept non-field form errors before
 * Payload shows its default error toast. Return `true` to claim the error (the
 * default toast is suppressed). Return `false` to let Payload handle it normally.
 *
 * Set via `<FormErrorHandlerContext value={handler}>` inside an
 * `admin.components.providers` entry. The Form reads this automatically — no
 * changes to collection config or the edit view are required.
 *
 * Multiple handlers can be chained by composing providers; the first one to
 * return `true` wins.
 */
export type FormErrorHandler = (err: NonFieldError) => boolean

export const FormErrorHandlerContext = createContext<FormErrorHandler | undefined>(undefined)

export const useFormErrorHandler = (): FormErrorHandler | undefined => use(FormErrorHandlerContext)
