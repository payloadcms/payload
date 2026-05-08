import './index.css'

type IconModule = {
  [key: string]: React.ComponentType | undefined
  default?: React.ComponentType
}

const iconModules = import.meta.glob<IconModule>(
  '../../../../../packages/ui/src/icons/*/index.tsx',
  {
    eager: true,
  },
)

type IconEntry = {
  Component: React.ComponentType
  name: string
}

function buildIconEntries(): IconEntry[] {
  const entries: IconEntry[] = []

  for (const [path, mod] of Object.entries(iconModules)) {
    const nameMatch = path.match(/\/icons\/([^/]+)\/index\.tsx$/)
    const name = nameMatch?.[1] ?? path

    const Component =
      mod.default ??
      Object.values(mod).find((v): v is React.ComponentType => typeof v === 'function')
    if (!Component) {
      continue
    }

    entries.push({ name, Component })
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

const iconEntries = buildIconEntries()

type IconGridProps = {
  onSelectIcon?: (iconName: string) => void
}

export function IconGrid({ onSelectIcon }: IconGridProps) {
  return (
    <div className="icon-grid">
      <h2 className="icon-grid__heading">Icons</h2>
      <div className="icon-grid__grid">
        {iconEntries.map(({ name, Component }) => (
          <button
            className="icon-grid__entry"
            key={name}
            onClick={() => onSelectIcon?.(name)}
            type="button"
          >
            <div className="icon-grid__preview">
              <Component />
            </div>
            <span className="icon-grid__name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
