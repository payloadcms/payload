import './index.css'

type IconModule = { [key: string]: React.ComponentType | undefined; default?: React.ComponentType }

const iconModules = import.meta.glob<IconModule>(
  '../../../../../packages/ui/src/icons/*/index.tsx',
  { eager: true },
)

type IconDetailProps = { iconName: string }

export function IconDetail({ iconName }: IconDetailProps) {
  const entry = Object.entries(iconModules).find(([path]) =>
    path.includes(`/icons/${iconName}/index.tsx`),
  )
  const mod = entry?.[1]
  const Component =
    mod?.default ??
    Object.values(mod ?? {}).find((v): v is React.ComponentType => typeof v === 'function')

  if (!Component) {
    return <div className="icon-detail__empty">Icon not found: {iconName}</div>
  }

  return (
    <div className="icon-detail">
      <div className="icon-detail__preview">
        <Component />
      </div>
      <span className="icon-detail__name">{iconName}</span>
    </div>
  )
}
