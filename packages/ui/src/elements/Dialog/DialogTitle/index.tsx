import './index.css'

const baseClass = 'dialog-title'

export const DialogTitle = ({ title }: { title: React.ReactNode }) => (
  <h4 className={baseClass}>{title}</h4>
)
