import type React from 'react'

import ReactDOM from 'react-dom'

const Portal = ({ children }: { children: React.ReactNode }): React.ReactPortal =>
  ReactDOM.createPortal(children, document.getElementById('portal'))

export default Portal
