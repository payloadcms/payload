import './index.css'

type ResizeHandleProps = {
  onMouseDown: (e: React.MouseEvent) => void
}

export function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  return <div aria-hidden="true" className="resize-handle" onMouseDown={onMouseDown} />
}
