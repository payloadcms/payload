/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY it because it could be re-written at any time. */
import { login } from '../../../../routes/auth/login'
import { me } from '../../../../routes/auth/me'
import { refresh } from '../../../../routes/auth/refresh'
import { init } from '../../../../routes/auth/init'
import { registerFirstUser } from '../../../../routes/auth/registerFirstUser'
import { forgotPassword } from '../../../../routes/auth/forgotPassword'
import { resetPassword } from '../../../../routes/auth/resetPassword'
import { createPayloadRequest } from '../../../../utilities/createPayloadRequest'
import config from 'payload-config'

export const POST = async (
  request: Request,
  { params }: { params: { collection: string; operation: string } },
) => {
  const { operation } = params
  const req = await createPayloadRequest({ request, config, params })

  switch (operation) {
    case 'login':
      return login({ req })
    case 'refresh':
      return refresh({ req })
    case 'register-first-user':
      return registerFirstUser({ req })
    case 'forgot-password':
      return forgotPassword({ req })
    case 'reset-password':
      return resetPassword({ req })
  }
}

export const GET = async (
  request: Request,
  { params }: { params: { collection: string; operation: string } },
) => {
  const { operation } = params
  const req = await createPayloadRequest({ request, config, params })

  switch (operation) {
    case 'me':
      return me({ req })
    case 'init':
      return init({ req })
  }
}
