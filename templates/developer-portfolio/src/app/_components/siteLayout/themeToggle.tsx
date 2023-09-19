'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '../../utilities'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdownMenu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex gap-4" asChild>
        <Button variant="outline">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 dark:hidden" />
          <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:inline" />
          Toggle theme
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-primary-foreground text-primary">
        <DropdownMenuItem
          className={cn('px-12 cursor-pointer', {
            'bg-primary text-primary-foreground': theme === 'light',
          })}
          onClick={() => setTheme('light')}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('px-12 cursor-pointer', {
            'bg-primary text-primary-foreground': theme === 'dark',
          })}
          onClick={() => setTheme('dark')}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn('px-12 cursor-pointer', {
            'bg-primary text-primary-foreground': theme === 'system',
          })}
          onClick={() => setTheme('system')}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
