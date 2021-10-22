import { Access } from '../config/types';
import { FieldAccess } from '../fields/config/types';

export type IncomingRevisionsType = {
  max?: number
  retainDeleted?: boolean
  access?: {
    read?: Access
    modifyStatus?: FieldAccess
  }
}
