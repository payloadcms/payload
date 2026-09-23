import { createPayloadReq } from 'payload'

const req = await createPayloadReq({ ...getOptions(), payload: getPayload() })
const conditional = createPayloadReq({ ...enabled ? first : second, payload: payload })
const nested = createPayloadReq({ ...{ req: await createPayloadReq({ payload: payload }) }, payload: payload })
