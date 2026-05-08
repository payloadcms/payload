import './app.css'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { CanvasHandle } from './components/Canvas'

import { Canvas } from './components/Canvas'
import { IconDetail } from './components/IconDetail'
import { IconGrid } from './components/IconGrid'
import { ResizeHandle } from './components/ResizeHandle'
import { RightPanel } from './components/RightPanel'
import { Sidebar } from './components/Sidebar'
import { TokenBrowser } from './components/TokenBrowser'
import { TopBar } from './components/TopBar'
import { useResize } from './hooks/useResize'
import { loadComponentSource, useStories } from './hooks/useStories'
import { useTheme } from './hooks/useTheme'
import { readActiveViewFromURL, writeActiveViewToURL } from './hooks/useViewURL'

type ActiveView =
  | { activeVariant: null | string; modulePath: string; type: 'story' }
  | { category: null | string; type: 'tokens' }
  | { iconName: string; type: 'icon' }
  | { type: 'icons' }
  | null

const ICON_NAMES = [
  'AlignJustified',
  'Arrow',
  'Calendar',
  'Check',
  'Chevron',
  'CirclePlus',
  'CircledX',
  'Clipboard',
  'CloseMenu',
  'CodeBlock',
  'Copy',
  'Document',
  'Dots',
  'Duplicate',
  'Edit',
  'ExternalLink',
  'Eye',
  'Filter',
  'Folder',
  'Gear',
  'GridView',
  'Line',
  'Link',
  'Lock',
  'LockOpen',
  'LogOut',
  'MinimizeMaximize',
  'More',
  'MoveFolder',
  'People',
  'Plus',
  'Refresh',
  'Search',
  'Sort',
  'Spinner',
  'Swap',
  'Tag',
  'ThreeDots',
  'Trash',
  'Write',
  'X',
]

const docModules = import.meta.glob<string>('../../../packages/ui/src/**/documentation.md', {
  eager: false,
  import: 'default',
  query: '?raw',
})

function setViewWithURL(view: ActiveView, setter: (v: ActiveView) => void) {
  setter(view)
  writeActiveViewToURL(view)
}

// eslint-disable-next-line no-restricted-exports -- Vite entry point requires default export
export default function App() {
  const { isHighContrast, setTheme, theme, toggleHighContrast } = useTheme()
  const { getStory, isLoading, sidebarSections } = useStories()
  const sidebar = useResize({ defaultWidth: 220, direction: 'right', maxWidth: 400, minWidth: 160 })
  const rightPanel = useResize({
    defaultWidth: 300,
    direction: 'left',
    maxWidth: 520,
    minWidth: 240,
  })
  const [activeView, setActiveView] = useState<ActiveView>(() => readActiveViewFromURL())
  const [docs, setDocs] = useState<null | string>(null)
  const [componentSource, setComponentSource] = useState<null | string>(null)
  const canvasRef = useRef<CanvasHandle>(null)

  const activeStoryPath =
    activeView?.type === 'story'
      ? activeView.modulePath
      : activeView?.type === 'tokens'
        ? activeView.category
          ? `__tokens__:${activeView.category}`
          : '__tokens__'
        : activeView?.type === 'icons'
          ? '__icons__'
          : activeView?.type === 'icon'
            ? `__icons__:${activeView.iconName}`
            : null

  const activeStory =
    activeView?.type === 'story' ? (getStory(activeView.modulePath) ?? null) : null

  const activeVariant = activeView?.type === 'story' ? activeView.activeVariant : null

  const handleSelectStory = useCallback(
    (modulePath: string) => {
      const story = getStory(modulePath)
      const firstVariant = story?.variants[0]?.name ?? null
      const view: ActiveView = { type: 'story', activeVariant: firstVariant, modulePath }
      setViewWithURL(view, setActiveView)
      setDocs(null)
      setComponentSource(null)
      canvasRef.current?.center()
    },
    [getStory],
  )

  const handleSelectVariant = useCallback((name: string) => {
    setActiveView((prev) => {
      if (prev?.type !== 'story') {
        return prev
      }
      const next: ActiveView = { ...prev, activeVariant: name }
      writeActiveViewToURL(next)
      return next
    })
  }, [])

  const handleSelectBuiltin = useCallback((section: 'icons' | 'tokens') => {
    const view: ActiveView =
      section === 'tokens' ? { type: 'tokens', category: null } : { type: section }
    setViewWithURL(view, setActiveView)
    setDocs(null)
    setComponentSource(null)
  }, [])

  const handleSelectTokenCategory = useCallback((category: string) => {
    setViewWithURL({ type: 'tokens', category }, setActiveView)
    setDocs(null)
    setComponentSource(null)
  }, [])

  const handleSelectIcon = useCallback((iconName: string) => {
    setViewWithURL({ type: 'icon', iconName }, setActiveView)
    setDocs(null)
    setComponentSource(null)
    canvasRef.current?.center()
  }, [])

  const activeStoryModulePath = activeView?.type === 'story' ? activeView.modulePath : null

  // Load co-located documentation.md when the selected story changes
  useEffect(() => {
    if (!activeStoryModulePath) {
      setDocs(null)
      return
    }

    const docPath = activeStoryModulePath
      .replace(/^\.\.\/\.\.\/\.\.\/\.\.\//, '../../../')
      .replace(/\/[^/]+\.stories\.tsx$/, '/documentation.md')
    if (docPath === activeStoryModulePath) {
      setDocs(null)
      return
    }

    const loader = docModules[docPath]
    if (!loader) {
      setDocs(null)
      return
    }

    loader()
      .then((content) => setDocs(content))
      .catch(() => setDocs(null))
  }, [activeStoryModulePath])

  // Load raw story source for the Source tab
  useEffect(() => {
    if (!activeStoryModulePath) {
      setComponentSource(null)
      return
    }

    loadComponentSource(activeStoryModulePath)
      .then((src) => setComponentSource(src))
      .catch(() => setComponentSource(null))
  }, [activeStoryModulePath])

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setActiveView(readActiveViewFromURL())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const activeVariantObj = activeStory?.variants.find((v) => v.name === activeVariant) ?? null

  return (
    <div className="app-layout">
      <TopBar
        isHighContrast={isHighContrast}
        onThemeChange={setTheme}
        onToggleHighContrast={toggleHighContrast}
        theme={theme}
      />
      <div className="app-body">
        <Sidebar
          activeStoryPath={activeStoryPath}
          iconNames={ICON_NAMES}
          onSelectBuiltin={handleSelectBuiltin}
          onSelectIcon={handleSelectIcon}
          onSelectStory={handleSelectStory}
          onSelectTokenCategory={handleSelectTokenCategory}
          sections={sidebarSections}
          style={{ width: sidebar.width }}
        />
        <ResizeHandle onMouseDown={sidebar.onMouseDown} />
        <div className="app-center">
          <div className="app-canvas">
            {activeView?.type === 'tokens' && <TokenBrowser category={activeView.category} />}
            {activeView?.type === 'icons' && <IconGrid onSelectIcon={handleSelectIcon} />}
            {activeView?.type === 'icon' && (
              <Canvas ref={canvasRef}>
                <IconDetail iconName={activeView.iconName} />
              </Canvas>
            )}
            {activeView?.type === 'story' && activeVariantObj && (
              <Canvas ref={canvasRef}>
                <activeVariantObj.component />
              </Canvas>
            )}
            {activeView === null && (
              <div className="app-empty">
                {isLoading ? 'Loading stories…' : 'Select a component from the sidebar'}
              </div>
            )}
          </div>
        </div>
        <ResizeHandle onMouseDown={rightPanel.onMouseDown} />
        <RightPanel
          activeVariant={activeVariant}
          componentSource={componentSource}
          docs={docs}
          onSelectVariant={handleSelectVariant}
          story={activeStory}
          style={{ width: rightPanel.width }}
          theme={theme}
        />
      </div>
    </div>
  )
}
