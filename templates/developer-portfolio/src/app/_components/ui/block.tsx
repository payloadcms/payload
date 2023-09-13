import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '../../../utilities'
import { FadeInContent } from './fadeInContent'

const blockVariants = cva('flex col-span-6 justify-center lg:justify-start', {
  variants: {
    size: {
      oneThird: 'lg:col-span-2',
      half: 'lg:col-span-3',
      twoThirds: 'lg:col-span-4',
      full: 'lg:col-span-6',
    },
  },
  defaultVariants: {
    size: 'full',
  },
})

export interface BlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof blockVariants> {
  size?: 'oneThird' | 'twoThirds' | 'half' | 'full'
  asChild?: boolean
}

const Block = React.forwardRef<HTMLDivElement, BlockProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : FadeInContent
    return <Comp className={cn(blockVariants({ size, className }))} ref={ref} {...props} />
  },
)
Block.displayName = 'Block'

export { Block, blockVariants }
