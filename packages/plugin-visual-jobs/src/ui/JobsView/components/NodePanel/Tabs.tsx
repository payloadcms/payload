'use client'
import { TabsProvider } from 'packages/ui/src/fields/Tabs/provider.js'
import { TabComponent } from 'packages/ui/src/fields/Tabs/Tab/index.js'
import React, { useEffect, useState } from 'react'

export type PanelTab = {
  Content: React.ReactNode
  name: string
}
const baseClass = 'tabs-field'

type Props = {
  tabs: PanelTab[]
}
export const Tabs: React.FC<Props> = (props) => {
  const { tabs } = props
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)

  useEffect(() => {
    setActiveTabIndex(0)
  }, [tabs])

  return (
    <TabsProvider>
      <div className={`${baseClass}__tabs-wrap`}>
        <div className={`${baseClass}__tabs`}>
          {tabs.map((tab, tabIndex) => {
            return (
              <TabComponent
                isActive={activeTabIndex === tabIndex}
                key={tabIndex}
                parentPath={''}
                setIsActive={() => {
                  setActiveTabIndex(tabIndex)
                }}
                tab={{ name: tab.name, fields: [] }}
              />
            )
          })}
        </div>
      </div>
      <div className={`${baseClass}__content-wrap`}>{tabs[activeTabIndex]?.Content}</div>
    </TabsProvider>
  )
}
