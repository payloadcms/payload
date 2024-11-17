import { Star } from 'lucide-react'
import React from 'react'

interface RatingProps {
  value: number
}

export const Rating: React.FC<RatingProps> = ({ value }) => {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={`rating__star ${
            star <= value ? 'rating__star--filled' : 'rating__star--empty'
          }`}
          key={star}
        />
      ))}
    </div>
  )
}
