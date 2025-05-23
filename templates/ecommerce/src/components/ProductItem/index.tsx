import { Media } from '@/components/Media'
import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Order, Product } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { formatNumberToCurrency } from '@/utilities/formatNumberToCurrency'
import Link from 'next/link'

type Props = {
  product: Product
  style?: 'compact' | 'default'
  selectedVariant?: string
  quantity?: number
}

export const ProductItem: React.FC<Props> = ({
  product,
  style = 'default',
  quantity,
  selectedVariant,
}) => {
  const { gallery, meta, title } = product

  const image = gallery?.[0] || meta?.image

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
        <div className="relative w-full h-full">
          {image && typeof image !== 'string' && (
            <Media className="" fill imgClassName="rounded-lg object-cover" resource={image} />
          )}
        </div>
      </div>
      <div className="flex grow justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-lg">{title}</p>
          {selectedVariant && (
            <p className="text-sm font-mono text-primary/50 tracking-[0.1em]">
              {product.variants
                ?.find((v) => v.id === selectedVariant)
                ?.options.map((option) => option.value)
                .join(', ')}
            </p>
          )}
          <div>
            {'x'}
            {quantity}
          </div>
        </div>

        {product.price && quantity && (
          <div className="text-right">
            <p className="font-medium text-lg">Subtotal</p>
            <Price
              className="font-mono text-primary/50 text-sm"
              amount={product.price * quantity}
              currencyCode="usd"
            />
          </div>
        )}
      </div>
    </div>
  )
}
