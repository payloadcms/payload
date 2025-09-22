/* eslint-disable no-restricted-exports */

import { type DashboardConfig } from 'payload'

export default function Count(args: { dashboardConfig: DashboardConfig }) {
  console.log(args)

  return (
    <div>
      Count
      <h1>Count</h1>
      <p>This is the count component</p>
      <p>This is the count component</p>
      {JSON.stringify(args.dashboardConfig)}
    </div>
  )
}
