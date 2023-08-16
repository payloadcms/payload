import type { Endpoint } from 'payload/config'

export const getUserDOB: Omit<Endpoint, 'root'> = {
  path: '/:settingsID/userDOB',
  method: 'get',
  handler: async (req, res) => {
    try {
      const accessibleDoc = await req.payload.findByID({
        collection: 'settings',
        id: req.params.settingsID,
        overrideAccess: false,
        user: req.user,
        showHiddenFields: true,
      })

      const userDOBVariable = accessibleDoc?.userDOB

      return res.status(200).json({ value: userDOBVariable })
    } catch (e: unknown) {
      return res.status(500).json({ error: 'User DOB not found', e })
    }
  },
}
