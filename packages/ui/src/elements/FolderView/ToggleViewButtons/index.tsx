import { GridViewIcon } from '../../../icons/GridView/index.js'
import { ListViewIcon } from '../../../icons/ListView/index.js'
import { Button } from '../../Button/index.js'
import './index.scss'

const baseClass = 'folder-view-toggle-button'

type Props = {
  activeView: 'grid' | 'list'
  setActiveView: (view: 'grid' | 'list') => void
}
export function ToggleViewButtons({ activeView, setActiveView }: Props) {
  return (
    <>
      <Button
        buttonStyle="pill"
        className={[baseClass, activeView === 'grid' && `${baseClass}--active`]
          .filter(Boolean)
          .join(' ')}
        icon={<GridViewIcon />}
        margin={false}
        onClick={() => {
          setActiveView('grid')
        }}
      />
      <Button
        buttonStyle="pill"
        className={[baseClass, activeView === 'list' && `${baseClass}--active`]
          .filter(Boolean)
          .join(' ')}
        icon={<ListViewIcon />}
        margin={false}
        onClick={() => {
          setActiveView('list')
        }}
      />
    </>
  )
}
