import { OrderStatus as StatusOptions } from '@/payload-types'
import clsx from 'clsx'

type Props = {
  status: StatusOptions
}

export const OrderStatus: React.FC<Props> = ({ status }) => {
  return (
    <div
      className={clsx('text-xs tracking-[0.1em] font-mono uppercase py-0 px-2 rounded', {
        'bg-primary/10': status === 'processing',
        'bg-accent/10 text-accent': status === 'completed',
      })}
    >
      {status}
    </div>
  )
}
