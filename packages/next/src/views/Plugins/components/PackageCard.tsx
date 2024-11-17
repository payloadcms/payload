import { Download } from 'lucide-react'
import React from 'react'

import type { Package } from './usePackages.js'

import { Rating } from './Rating.js'

interface PackageCardProps {
  pkg: Package
  view: 'grid' | 'list'
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, view }) => {
  const formatDownloads = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const cardClassName = `package-card package-card--${view}`

  return (
    <div className={cardClassName}>
      <div className="package-card__content">
        <div className="package-card__info">
          <h3 className="package-card__title">{pkg.name}</h3>
          <p
            className={`package-card__description ${
              view === 'grid' ? 'package-card__description--grid' : ''
            }`}
          >
            {pkg.description}
          </p>
          <div className="package-card__meta">
            <Rating value={pkg.rating} />
            <div className="package-card__downloads">
              <Download className="package-card__downloads-icon" />
              {formatDownloads(pkg.downloads)}
            </div>
            <span>v{pkg.version}</span>
          </div>
        </div>
        <button
          className={`package-card__button ${
            pkg.isInstalled ? 'package-card__button--installed' : ''
          }`}
          type="button"
        >
          {pkg.isInstalled ? 'Installed' : 'Install'}
        </button>
      </div>
    </div>
  )
}
