import { Payload } from "../../.."
import { SanitizedCollectionConfig, TypeWithID } from "../../../collections/config/types"

type Args = {
  payload: Payload
  doc: TypeWithID & Record<string, unknown>
  collection: SanitizedCollectionConfig
}

export const resetLoginAttempts = async ({
  payload,
  doc,
  collection,
}: Args): Promise<void> => {
  await payload.update({
    collection: collection.slug,
    id: doc.id,
    data: {
      loginAttempts: 0,
      lockUntil: null,
    },
  })
}