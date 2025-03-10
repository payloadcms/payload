type Props = {
  keys: { id?: string | null; value: string; slug: string }[]
}

export const KeysCell: React.FC<Props> = (args) => {
  const { keys } = args

  return (
    <div className="keysList">
      {keys && keys.length > 0 ? (
        keys.map((key, index) => {
          return (
            <div key={`key-${key.id || index}`} className="key">
              {key.value}
            </div>
          )
        })
      ) : (
        <>No options selected yet.</>
      )}
    </div>
  )
}
