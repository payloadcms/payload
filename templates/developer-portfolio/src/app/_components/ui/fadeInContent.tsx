'use client'

import React, { AllHTMLAttributes, FC, PropsWithChildren, useEffect, useRef } from 'react'

export const FadeInContent: FC<PropsWithChildren<AllHTMLAttributes<HTMLDivElement>>> = ({
  children,
  className = '',
  ...props
}) => {
  const contentRef = useRef(null)

  useEffect(() => {
    const currentRef = contentRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-10')
          entry.target.classList.add(
            'opacity-100',
            'transition-all',
            'duration-500',
            'ease-in-out',
            'translate-y-0',
          )
        }
      },
      {
        threshold: 0, // Adjust this value to control how much of the element must be visible before the fade-in starts
      },
    )

    if (contentRef.current) {
      observer.observe(contentRef.current)
    }

    return () => {
      observer.unobserve(currentRef)
    }
  }, [])

  return (
    <div ref={contentRef} className={`opacity-0 translate-y-10 ${className}`} {...props}>
      {children}
    </div>
  )
}
