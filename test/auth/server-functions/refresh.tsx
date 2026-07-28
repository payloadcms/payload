'use client'

type Props = {
  refreshFunction: () => Promise<unknown>
}

export const RefreshToken = ({ refreshFunction }: Props) => {
  return (
    <button onClick={() => refreshFunction()} type="button">
      Custom Refresh
    </button>
  )
}
