import { Payload } from "../../.."
import { TypeWithID } from "../../../collections/config/types"

type Args = {
  payload: Payload
  doc: TypeWithID & Record<string, unknown>
  collection: string
  lockTime: number
}

export const incrementLoginAttempts = async ({ payload, doc, collection, lockTime }: Args): Promise<void> => {
  if ('lockUntil' in doc && typeof doc.lockUntil === 'string') {

    const lockUntil = Math.floor(new Date(doc.lockUntil).getTime() / 1000)

    if (lockUntil < Date.now()) {
      await payload.update({
        collection,
        id: doc.id,
        data: {
          loginAttempts: 1,
          lockUntil: null,
        }
      })
    }

    return
  }

  const lockUntil = new Date((Date.now() + lockTime))

  await payload.update({
    collection,
    id: doc.id,
    data: {
      loginAttempts: Number(doc.loginAttempts) + 1,
      lockUntil,
    }
  })
}