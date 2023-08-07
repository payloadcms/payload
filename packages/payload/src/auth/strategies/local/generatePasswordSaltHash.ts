import crypto from 'crypto'
import { ValidationError } from "../../../errors"

const defaultPasswordValidator = (password: string): string | true => {
  if (!password) return 'No password was given'
  if (password.length < 3) return 'Password must be at least 3 characters'

  return true
}

function randomBytes(): Promise<Buffer> {
  return new Promise((resolve, reject) => crypto.randomBytes(32, (err, saltBuffer) => (err ? reject(err) : resolve(saltBuffer))));
}

function pbkdf2Promisified(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashRaw) => (err ? reject(err) : resolve(hashRaw))));
}

type Args = {
  password: string
}

export const generatePasswordSaltHash = async ({
  password,
}: Args): Promise<{ salt: string, hash: string }> => {
  const validationResult = defaultPasswordValidator(password)

  if (typeof validationResult === 'string') {
    throw new ValidationError([{ message: validationResult, field: 'password' }])
  }

  const saltBuffer = await randomBytes()
  const salt = saltBuffer.toString('hex')

  const hashRaw = await pbkdf2Promisified(password, salt)
  const hash = hashRaw.toString('hex')

  return { salt, hash }
}