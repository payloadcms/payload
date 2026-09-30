# Recursive Popup Menus

## Decision

Adds recursive submenu coordination to `Popup` as a standalone UI capability. A nested menu registers with its nearest parent menu, creates a new scope for its own children, and keeps its ancestor branch open while the pointer or focus moves deeper.

This work starts from `origin/main` on `codex/recursive-popup-menus`. It does not move the account trigger, restructure the navigation, or depend on the account-nav PR. That PR can consume this capability after rebasing.

## Behavior

`Popup` supports arbitrary `menu -> submenu -> submenu` composition with mixed activation modes:

```tsx
<Popup popupType="menu">
  <Popup hoverSubmenu popupType="menu">
    <Popup popupType="menu">
      <Popup hoverSubmenu popupType="menu">...</Popup>
    </Popup>
  </Popup>
</Popup>
```

The component tree defines ownership. Consumers do not provide parent IDs or coordination providers.

- Ancestors remain open while a descendant submenu is active.
- Only direct siblings compete for the same active slot.
- Activating a sibling closes the previous sibling and its complete descendant branch.
- Hover activation uses pointer intent; click and keyboard activation are immediate.
- A nested non-hover popup participates in the same tree and opens by press.
- Closing a menu recursively closes its active descendants and cancels their timers.
- Reopening a branch starts without stale active-child or pending-timer state.

## Public API

Adds `hoverSubmenu?: boolean` to `PopupProps`.

Structural nesting and activation mode remain separate:

```ts
const isSubmenu = parentPopup?.popupRole === 'menu' && popupRole === 'menu'
const activationMode = hoverSubmenu ? 'hover' : 'press'
```

Every structurally nested menu registers with its parent scope. `hoverSubmenu` adds hover activation and pointer-intent behavior; it does not determine whether the popup is a submenu.

Existing root popups, nested press-opened menus, `showOnHover`, controlled `forceOpen`, and trigger render props retain their current behavior.

## Ownership Model

Each menu creates one stable child scope and exposes it through `PopupContext`. A nested menu consumes the nearest scope, registers one node in it, and provides a different scope to its own children.

```text
Main menu scope
├── Theme node (active)
│   └── Theme child scope
│       ├── Color node (active)
│       │   └── Color child scope
│       │       └── Contrast node (active)
│       └── Typography node
└── Language node
```

The scopes are local controllers, not a global registry. A scope tracks only its direct children:

```ts
type MenuScope = {
  activeChildId: null | string
  pendingChildId: null | string
  cancelPending: (id?: string) => void
  closeActiveBranch: () => void
  register: (node: SubmenuNode) => () => void
  requestOpen: (args: { delay: boolean; id: string }) => void
}

type SubmenuNode = {
  closeBranch: () => void
  id: string
  open: (viaKeyboard: boolean) => void
}
```

The scope does not duplicate React open state. `Popup.active` remains the only rendered-open state. The scope invokes registered node operations to coordinate branches.

## State Transitions

All hover, pointer, keyboard, click, and programmatic open paths converge on the same internal operation.

Opening a nested menu:

1. Cancel that node's pending close.
2. Ask the parent scope to activate the node.
3. Keep the current sibling branch open while a hover-intent delay is pending.
4. When activation commits, close the previous sibling branch recursively.
5. Open the requested node and record it as the active direct child.

Closing a menu:

1. Cancel its pending open and close timers.
2. Close its child scope's active branch recursively.
3. Set its local `active` state to `false`.
4. Clear its parent scope's active reference when it still points to this node.

Unregistering a node cancels pending work that targets it and clears an active reference without issuing state updates to the unmounting component.

## Pointer Intent

Pointer intent remains local to one submenu. It owns the trigger ref, popup-content ref, safe-corridor geometry, and close timer. Sibling coordination remains in `MenuScope`.

The active branch includes nested popup content. Although popovers render in the browser top layer, nested popup elements remain DOM descendants. An ancestor treats a pointer target as inside its branch when its popup content contains the event target:

```ts
popupContent.contains(pointerEvent.target as Node)
```

This keeps every ancestor open when the pointer enters a grandchild submenu. Geometry is used only while crossing the empty visual gap between a trigger and its directly associated content.

Timing rules:

- The first hovered child opens immediately.
- Crossing a sibling while another branch is active starts an open-intent delay.
- Returning to the active branch cancels the pending sibling activation.
- Initial trigger-to-content transit receives a longer close grace period.
- Leaving after the pointer has landed uses a shorter close delay.
- Entering any active descendant cancels ancestor close timers.
- Pointer opening never moves focus.

Timing values remain internal constants. The public API does not expose tuning until multiple consumers demonstrate a need.

## Keyboard and Focus

Recursive menus follow one keyboard model at every depth:

- `ArrowRight` opens the focused submenu immediately and focuses its first item.
- `ArrowLeft` closes the current submenu and restores focus to its trigger.
- `Enter` and `Space` open or activate the focused press submenu.
- `Escape` closes the current level and restores focus to its trigger.
- `ArrowUp`, `ArrowDown`, `Home`, and `End` navigate only the current menu.
- `Tab` exits and closes the complete popup chain.
- Pointer activation does not steal focus.

Each trigger exposes `aria-haspopup`, `aria-expanded`, and `aria-controls`. Nested triggers retain the `menuitem` role and roving `tabIndex` behavior expected by the parent menu.

## Component Boundaries

`Popup` owns local open state, detects structural nesting, registers its node, provides its child scope, and recursively closes descendants.

`MenuScope` is a small factory-created controller. It owns direct-child registration, sibling activation, branch replacement, and pending-open cleanup. It has no knowledge of pointer geometry or rendered styles.

`useSubmenuPointerIntent` owns pointer events, trigger/content geometry, safe-corridor behavior, and close timing. It has no sibling registry and cannot close an ancestor directly.

`PopupTrigger` receives the activation handlers and ARIA state from `Popup`. Hover-only triggers prevent pointer clicks from toggling state, while keyboard activation remains available.

## Testing

Browser component tests cover the reusable component behavior:

1. Three hover levels remain open simultaneously.
2. Switching deepest siblings preserves their shared ancestors.
3. Switching a top-level sibling closes the previous descendant branch.
4. `hover -> press -> hover` nesting works.
5. Returning to an active branch cancels delayed sibling activation.
6. Trigger-to-content movement survives the visual gap and popup padding.
7. A non-hover root popup never receives hover-close behavior.
8. Closing and reopening does not retain stale scope state.
9. `ArrowRight`, `ArrowLeft`, `Escape`, and focus restoration work across three levels.
10. Trigger roles, expanded state, and controls relationships remain correct at every depth.

An end-to-end accessibility regression uses a production menu integration rather than a simplified fixture. It verifies pointer persistence, keyboard traversal, dismissal, focus restoration, and rendered ARIA state.

Manual verification covers pointer-intent feel, visible focus quality, viewport-edge flipping, and movement through densely stacked sibling triggers.

## Accessibility Assessment

The implementation and handoff assess these WCAG 2.2 Level A and AA criteria:

- 1.3.1 Info and Relationships: menu, menuitem, and nested popup relationships remain programmatic.
- 1.4.13 Content on Hover or Focus: submenu content is hoverable, dismissible, and persistent while the branch remains engaged.
- 2.1.1 Keyboard: every open, navigation, selection, and close operation is keyboard available.
- 2.1.2 No Keyboard Trap: `ArrowLeft`, `Escape`, and `Tab` provide predictable exits.
- 2.4.3 Focus Order: focus enters and returns through the menu hierarchy in a meaningful sequence.
- 2.4.7 Focus Visible: visible focus is retained at each level.
- 2.4.11 Focus Not Obscured: positioned submenu content does not entirely obscure the focused item.
- 2.5.2 Pointer Cancellation: submenu activation is not completed on pointer-down.
- 2.5.8 Target Size (Minimum): existing menu-item targets remain at least 24 by 24 CSS pixels or satisfy the spacing exception.
- 3.2.1 On Focus: focus alone does not unexpectedly activate pointer-only behavior.
- 3.2.3 Consistent Navigation and 3.2.4 Consistent Identification: the same menu interactions behave consistently at every depth.
- 4.1.2 Name, Role, Value: names, roles, expanded state, and controls relationships update with menu state.

Automated evidence supports only the states and outcomes it directly asserts. Pointer timing and visible focus quality still require human review; exact screen-reader speech requires assistive-technology testing if it becomes part of the acceptance criteria.

## Branch Integration

The branch contains only generic Popup implementation, component tests, and accessibility evidence. It does not modify the UserMenu or navigation layout to consume hover activation.

After this branch is reviewed, the account-nav branch can rebase onto it, remove its local/global submenu coordinator, and use the shared `hoverSubmenu` behavior. Keeping consumption separate prevents the reusable primitive from inheriting UserMenu-specific assumptions.
