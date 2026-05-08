import './index.css'

import type { SidebarSection } from '../../hooks/useStories'

import { useLocalStorage } from '../../hooks/useLocalStorage'

type TokenSubItem = {
  key: null | string
  label: string
}

type SidebarProps = {
  activeStoryPath: null | string
  iconNames: string[]
  onSelectBuiltin: (section: 'icons' | 'tokens') => void
  onSelectIcon: (iconName: string) => void
  onSelectStory: (modulePath: string) => void
  onSelectTokenCategory: (category: string) => void
  sections: SidebarSection[]
  style?: React.CSSProperties
}

function SidebarSection({
  activeStoryPath,
  items,
  onSelectStory,
  title,
}: {
  activeStoryPath: null | string
  items: SidebarSection['items']
  onSelectStory: (path: string) => void
  title: string
}) {
  const [isOpen, setIsOpen] = useLocalStorage(`sidebar-open-${title.toLowerCase()}`, true)

  return (
    <div className="sidebar__section">
      <button className="sidebar__section-header" onClick={() => setIsOpen(!isOpen)} type="button">
        <span className={`sidebar__chevron${isOpen ? ' sidebar__chevron--open' : ''}`}>▶</span>
        {title}
      </button>
      {isOpen && (
        <ul className="sidebar__items">
          {items.map((item) => (
            <li key={item.storyPath}>
              <button
                className={`sidebar__item${activeStoryPath === item.storyPath ? ' sidebar__item--active' : ''}`}
                onClick={() => onSelectStory(item.storyPath)}
                type="button"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type BuiltinSectionProps = {
  activeStoryPath: null | string
  label: string
  onSelectItem: (key: null | string) => void
  sentinelPrefix: string
  subItems?: TokenSubItem[]
}

function BuiltinSection({
  activeStoryPath,
  label,
  onSelectItem,
  sentinelPrefix,
  subItems,
}: BuiltinSectionProps) {
  const storageKey = `sidebar-open-${sentinelPrefix.replace(/_/g, '')}`
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, true)

  const isBrowseAllActive = activeStoryPath === sentinelPrefix

  return (
    <div className="sidebar__section">
      <button className="sidebar__section-header" onClick={() => setIsOpen(!isOpen)} type="button">
        <span className={`sidebar__chevron${isOpen ? ' sidebar__chevron--open' : ''}`}>▶</span>
        {label}
      </button>
      {isOpen && (
        <ul className="sidebar__items">
          <li>
            <button
              className={`sidebar__item${isBrowseAllActive ? ' sidebar__item--active' : ''}`}
              onClick={() => onSelectItem(null)}
              type="button"
            >
              Browse all
            </button>
          </li>
          {subItems?.map((item) => {
            const itemPath = `${sentinelPrefix}:${item.key}`
            const isItemActive = activeStoryPath === itemPath
            return (
              <li key={item.key}>
                <button
                  className={`sidebar__item sidebar__item--sub${isItemActive ? ' sidebar__item--active' : ''}`}
                  onClick={() => onSelectItem(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const TOKEN_SUB_ITEMS: TokenSubItem[] = [
  { key: 'palette', label: 'Palette' },
  { key: 'colors', label: 'Semantic Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'radius', label: 'Radius' },
  { key: 'elevations', label: 'Elevations' },
  { key: 'utilities', label: 'Utilities' },
]

export function Sidebar({
  activeStoryPath,
  iconNames,
  onSelectBuiltin,
  onSelectIcon,
  onSelectStory,
  onSelectTokenCategory,
  sections,
  style,
}: SidebarProps) {
  const iconSubItems: TokenSubItem[] = iconNames.map((name) => ({ key: name, label: name }))

  return (
    <nav className="sidebar" style={style}>
      <BuiltinSection
        activeStoryPath={activeStoryPath}
        label="TOKENS"
        onSelectItem={(key) => {
          if (key === null) {
            onSelectBuiltin('tokens')
          } else {
            onSelectTokenCategory(key)
          }
        }}
        sentinelPrefix="__tokens__"
        subItems={TOKEN_SUB_ITEMS}
      />
      <BuiltinSection
        activeStoryPath={activeStoryPath}
        label="ICONS"
        onSelectItem={(key) => {
          if (key === null) {
            onSelectBuiltin('icons')
          } else {
            onSelectIcon(key)
          }
        }}
        sentinelPrefix="__icons__"
        subItems={iconSubItems}
      />
      {sections
        .filter((s) => s.title !== 'Tokens' && s.title !== 'Icons')
        .map((section) => (
          <SidebarSection
            activeStoryPath={activeStoryPath}
            items={section.items}
            key={section.title}
            onSelectStory={onSelectStory}
            title={section.title.toUpperCase()}
          />
        ))}
    </nav>
  )
}
