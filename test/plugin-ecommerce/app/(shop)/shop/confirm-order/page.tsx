import { ConfirmOrder } from '@/components/ConfirmOrder.js'

export const ConfirmOrderPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  return (
    <div>
      <ConfirmOrder />
    </div>
  )
}

export default ConfirmOrderPage
