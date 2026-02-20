'use client'
import { createContext, use } from 'react'

/**
 * Callback invoked by `useField` when a field value changes via `setValue`.
 * Provided through `FieldChangeNotifierProvider` to let ancestor components
 * react to child field mutations (e.g. syncing form data back to a data model).
 */
export type FieldChangeNotifier = (args: {
  /** Full form-state path of the changed field */
  path: string
  /** New field value */
  value: unknown
}) => void

const FieldChangeNotifierContext = createContext<FieldChangeNotifier | null>(null)

export const FieldChangeNotifierProvider = FieldChangeNotifierContext.Provider

export const useFieldChangeNotifier = () => use(FieldChangeNotifierContext)
