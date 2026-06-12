import type { Result as AxeResults } from 'axe-core'

export interface AxeViolationTarget {
  /** Failure summary explaining why it failed */
  failureSummary?: string
  /** URL with more information */
  helpUrl: string
  /** HTML snippet of the violating element */
  html: string
  /** Impact level of the violation */
  impact: string
  /** The CSS selector(s) to locate this element */
  selector: string
  /** The full target array from axe */
  targetArray: string[]
  /** The violation description */
  violationHelp: string
  /** The violation rule ID */
  violationId: string
}
