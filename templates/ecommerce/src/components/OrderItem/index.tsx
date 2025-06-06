import { OrderStatus } from '@/components/OrderStatus'
import { Button } from '@/components/ui/button'
import { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { formatNumberToCurrency } from '@/utilities/formatNumberToCurrency'
import Link from 'next/link'

type Props = {
  order: Order
}

export const OrderItem: React.FC<Props> = ({ order }) => {
  return (
    <div className="bg-card border rounded-lg px-6 py-4 flex gap-12 items-center justify-between">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm uppercase font-mono tracking-[0.1em] text-primary/50">{`#${order.id}`}</h3>

        <div className="flex items-center gap-6">
          <p className="text-xl">
            <time dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </p>

          <OrderStatus status={order.status} />
        </div>

        <p className="flex gap-2 text-xs text-primary/80">
          <span>{order.items?.length} Items</span>
          <span>•</span>
          <span>{formatNumberToCurrency(order.total)}</span>
        </p>
      </div>

      <Button variant="outline" asChild>
        <Link href={`/orders/${order.id}`}>View Order</Link>
      </Button>
    </div>
  )
}
