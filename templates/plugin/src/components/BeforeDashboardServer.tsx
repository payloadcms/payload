import type { ServerComponentProps } from 'payload'

export const BeforeDashboardServer = async (props: ServerComponentProps) => {
  return (
    <div>
      <h1>Added by the plugin: Before Dashboard Server</h1>
    </div>
  )
}
