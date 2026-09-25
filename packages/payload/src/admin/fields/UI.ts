import type { MarkOptional } from 'ts-essentials'

import type { UIField, UIFieldClient } from '../../fields/config/types.js'
import type {
  ClientFieldBase,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldPaths,
  ServerFieldBase,
} from '../types.js'

type UIFieldClientWithoutType = MarkOptional<UIFieldClient, 'type'>

type UIFieldBaseClientProps = {
  readonly path: string
}

type UIFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type UIFieldClientProps = ClientFieldBase<UIFieldClientWithoutType> & UIFieldBaseClientProps

export type UIFieldServerProps = ServerFieldBase<UIField, UIFieldClientWithoutType> &
  UIFieldBaseServerProps
export type UIFieldDiffServerComponent = FieldDiffServerComponent<UIField, UIFieldClient>

export type UIFieldDiffClientComponent = FieldDiffClientComponent<UIFieldClient>
