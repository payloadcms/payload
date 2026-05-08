import './index.css'
import type { StoryVariant } from '../../hooks/useStories'

type VariantChipsProps = {
  activeVariant: null | string
  onSelectVariant: (name: string) => void
  variants: StoryVariant[]
}

export function VariantChips({ activeVariant, onSelectVariant, variants }: VariantChipsProps) {
  if (variants.length === 0) {
    return null
  }

  return (
    <div className="variant-chips">
      <span className="variant-chips__label">Variants</span>
      <div className="variant-chips__list">
        {variants.map((variant) => (
          <button
            className={`variant-chips__chip${activeVariant === variant.name ? ' variant-chips__chip--active' : ''}`}
            key={variant.name}
            onClick={() => onSelectVariant(variant.name)}
            type="button"
          >
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  )
}
