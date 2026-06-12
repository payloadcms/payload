'use client'

import type { JSONFieldClientProps } from 'payload'

import { CheckboxInput, Collapsible, useField } from '@payloadcms/ui'
import React, { useState } from 'react'

import type { ClientMCPPluginConfig, MCPAPIKeysDocAccessTree } from '../../types.js'

import './index.css'

const baseClass = 'mcp-access-field'

type ClientItem = ClientMCPPluginConfig['items'][number]
type ScopeKey = 'collections' | 'globals'
type FlatKey = 'prompts' | 'resources' | 'tools'
type TabKey = 'collections' | 'globals' | 'server'

// TODO: group labels need i18n once design is finalized
const LEAF_GROUPS = [
  { key: 'operations', label: 'Operations' },
  { key: 'auth', label: 'Authentication' },
  { key: 'custom', label: 'Custom' },
] as const

type Props = {
  pluginConfig: ClientMCPPluginConfig
} & JSONFieldClientProps

/** Drop a key from an object and return a new object — or `undefined` if it'd be empty. */
const without = <T extends Record<string, unknown>>(
  obj: T | undefined,
  key: string,
): T | undefined => {
  if (!obj || !(key in obj)) {
    return obj
  }
  const { [key]: _omitted, ...rest } = obj
  return Object.keys(rest).length === 0 ? undefined : (rest as T)
}

const setKey = <T extends Record<string, unknown>>(
  obj: T | undefined,
  key: string,
  value: unknown,
): T => ({ ...(obj ?? {}), [key]: value }) as T

export const AccessField: React.FC<Props> = ({ path, pluginConfig }) => {
  const { setValue, value } = useField<MCPAPIKeysDocAccessTree>({ path })
  const [activeTab, setActiveTab] = useState<null | TabKey>(null)
  const access = value ?? {}

  const collectionsBySlug: Record<string, ClientItem[]> = {}
  const globalsBySlug: Record<string, ClientItem[]> = {}
  const prompts: ClientItem[] = []
  const resources: ClientItem[] = []
  const tools: ClientItem[] = []

  for (const item of pluginConfig.items) {
    switch (item.type) {
      case 'collectionTool':
        ;(collectionsBySlug[item.collectionSlug!] ??= []).push(item)
        break
      case 'globalTool':
        ;(globalsBySlug[item.globalSlug!] ??= []).push(item)
        break
      case 'prompt':
        prompts.push(item)
        break
      case 'resource':
        resources.push(item)
        break
      case 'tool':
        tools.push(item)
        break
    }
  }

  const isScopedAllowed = (scope: ScopeKey, slug: string, configKey: string): boolean =>
    access[scope]?.[slug]?.[configKey] !== false

  const isFlatAllowed = (scope: FlatKey, configKey: string): boolean =>
    access[scope]?.[configKey] !== false

  const toggleScoped = (scope: ScopeKey, slug: string, configKey: string, allow: boolean) => {
    if (allow) {
      const slugBucket = without(access[scope]?.[slug], configKey)
      const scopeBucket = slugBucket
        ? setKey(access[scope], slug, slugBucket)
        : without(access[scope], slug)
      setValue(scopeBucket ? setKey(access, scope, scopeBucket) : (without(access, scope) ?? {}))
    } else {
      setValue(
        setKey(
          access,
          scope,
          setKey(access[scope], slug, setKey(access[scope]?.[slug], configKey, false)),
        ),
      )
    }
  }

  const toggleFlat = (scope: FlatKey, configKey: string, allow: boolean) => {
    if (allow) {
      const bucket = without(access[scope], configKey)
      setValue(bucket ? setKey(access, scope, bucket) : (without(access, scope) ?? {}))
    } else {
      setValue(setKey(access, scope, setKey(access[scope], configKey, false)))
    }
  }

  const setAllScoped = (scope: ScopeKey, slug: string, leaves: ClientItem[], allow: boolean) => {
    if (allow) {
      const scopeBucket = without(access[scope], slug)
      setValue(scopeBucket ? setKey(access, scope, scopeBucket) : (without(access, scope) ?? {}))
    } else {
      const slugBucket = leaves.reduce<Record<string, boolean>>(
        (acc, leaf) => ({ ...acc, [leaf.configKey]: false }),
        {},
      )
      setValue(setKey(access, scope, setKey(access[scope], slug, slugBucket)))
    }
  }

  const setAllFlat = (scope: FlatKey, leaves: ClientItem[], allow: boolean) => {
    if (allow) {
      setValue(without(access, scope) ?? {})
    } else {
      const bucket = leaves.reduce<Record<string, boolean>>(
        (acc, leaf) => ({ ...acc, [leaf.configKey]: false }),
        {},
      )
      setValue(setKey(access, scope, bucket))
    }
  }

  const renderLeaf = (
    leaf: ClientItem,
    id: string,
    checked: boolean,
    onToggle: (allow: boolean) => void,
  ) => (
    <li className={`${baseClass}__leaf`} key={leaf.configKey}>
      <CheckboxInput
        checked={checked}
        id={id}
        label={leaf.label}
        onToggle={(e) => onToggle(e.target.checked)}
      />
      {leaf.description && <p className={`${baseClass}__leaf-description`}>{leaf.description}</p>}
    </li>
  )

  const renderCard = ({
    id,
    isLeafAllowed,
    label,
    leaves,
    onSetAll,
    onToggleLeaf,
  }: {
    id: string
    isLeafAllowed: (leaf: ClientItem) => boolean
    label: string
    leaves: ClientItem[]
    onSetAll: (allow: boolean) => void
    onToggleLeaf: (leaf: ClientItem, allow: boolean) => void
  }) => {
    const allowedCount = leaves.filter(isLeafAllowed).length
    const groups = LEAF_GROUPS.map((group) => ({
      ...group,
      leaves: leaves.filter((leaf) => (leaf.group ?? 'custom') === group.key),
    })).filter((group) => group.leaves.length > 0)
    const hasGroupLabels = groups.length > 1

    return (
      <Collapsible
        className={`${baseClass}__card`}
        header={
          // Keep header clicks on the checkbox from also toggling the collapsible.
          <span
            className={`${baseClass}__card-checkbox`}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <CheckboxInput
              checked={allowedCount === leaves.length}
              id={`${id}._all`}
              label={label}
              onToggle={() => onSetAll(allowedCount < leaves.length)}
              partialChecked={allowedCount > 0 && allowedCount < leaves.length}
            />
          </span>
        }
        initCollapsed
        key={id}
      >
        <div className={`${baseClass}__card-groups`}>
          {groups.map((group) => (
            <div className={`${baseClass}__leaf-group`} key={group.key}>
              {hasGroupLabels && <p className={`${baseClass}__leaf-group-label`}>{group.label}</p>}
              <ul className={`${baseClass}__list`}>
                {group.leaves.map((leaf) =>
                  renderLeaf(leaf, `${id}.${leaf.configKey}`, isLeafAllowed(leaf), (allow) =>
                    onToggleLeaf(leaf, allow),
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </Collapsible>
    )
  }

  const renderScope = (scope: ScopeKey, bySlug: Record<string, ClientItem[]>) =>
    Object.entries(bySlug).map(([slug, leaves]) =>
      renderCard({
        id: `${path}.${scope}.${slug}`,
        isLeafAllowed: (leaf) => isScopedAllowed(scope, slug, leaf.configKey),
        label: titleCase(slug),
        leaves,
        onSetAll: (allow) => setAllScoped(scope, slug, leaves, allow),
        onToggleLeaf: (leaf, allow) => toggleScoped(scope, slug, leaf.configKey, allow),
      }),
    )

  const renderFlat = (scope: FlatKey, label: string, leaves: ClientItem[]) =>
    leaves.length > 0 &&
    renderCard({
      id: `${path}.${scope}`,
      isLeafAllowed: (leaf) => isFlatAllowed(scope, leaf.configKey),
      label,
      leaves,
      onSetAll: (allow) => setAllFlat(scope, leaves, allow),
      onToggleLeaf: (leaf, allow) => toggleFlat(scope, leaf.configKey, allow),
    })

  // TODO: tab labels need i18n once design is finalized
  const tabs: Array<{ key: TabKey; label: string }> = [
    ...(Object.keys(collectionsBySlug).length > 0
      ? [{ key: 'collections' as const, label: 'Collections' }]
      : []),
    ...(Object.keys(globalsBySlug).length > 0
      ? [{ key: 'globals' as const, label: 'Globals' }]
      : []),
    ...(prompts.length > 0 || resources.length > 0 || tools.length > 0
      ? [{ key: 'server' as const, label: 'Server' }]
      : []),
  ]
  const currentTab = activeTab ?? tabs[0]?.key

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        {/* TODO: needs i18n once design is finalized */}
        <h4>Permissions</h4>
        {/* TODO: needs i18n once design is finalized */}
        <p>Allow MCP clients to access the following collections, tools, resources, and prompts.</p>
      </header>
      <div className={`${baseClass}__tabs`} role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={tab.key === currentTab}
            className={[`${baseClass}__tab`, tab.key === currentTab && `${baseClass}__tab--active`]
              .filter(Boolean)
              .join(' ')}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={`${baseClass}__cards`}>
        {currentTab === 'collections' && renderScope('collections', collectionsBySlug)}
        {currentTab === 'globals' && renderScope('globals', globalsBySlug)}
        {currentTab === 'server' && (
          <>
            {/* TODO: card labels need i18n once design is finalized */}
            {renderFlat('prompts', 'Prompts', prompts)}
            {renderFlat('resources', 'Resources', resources)}
            {renderFlat('tools', 'Tools', tools)}
          </>
        )}
      </div>
    </div>
  )
}

const titleCase = (slug: string): string =>
  slug.replace(/(^|[-_])(.)/g, (_, sep: string, ch: string) =>
    sep ? ` ${ch.toUpperCase()}` : ch.toUpperCase(),
  )
