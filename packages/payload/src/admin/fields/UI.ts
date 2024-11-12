import type { MarkOptional } from 'ts-essentials'

import type { UIField, UIFieldClient } from '../../fields/config/types.js'
import type { FieldClientComponent, FieldServerComponent } from '../types.js'

type UIFieldClientWithoutType = MarkOptional<UIFieldClient, 'type'>
export type UIFieldClientComponent = FieldClientComponent<UIFieldClientWithoutType>

export type UIFieldServerComponent = FieldServerComponent<UIField, UIFieldClientWithoutType>
