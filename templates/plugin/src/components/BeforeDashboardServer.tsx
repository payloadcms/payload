import type { ServerComponentProps } from 'payload'

import styles from './BeforeDashboardServer.module.css'

export const BeforeDashboardServer = async (props: ServerComponentProps) => {
  const { payload, req } = props

  const { docs } = await payload.find({ collection: 'plugin-collection', req })

  return (
    <div className={styles.wrapper}>
      <h1>Added by the plugin: Before Dashboard Server</h1>
      Docs from Local API:
      {docs.map((doc) => (
        <div key={doc.id}>{doc.id}</div>
      ))}
    </div>
  )
}
