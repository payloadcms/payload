# CSS Migration — Known Issues

## Monaco Editor Theming

Currently Monaco uses built-in `vs` / `vs-dark` themes with no connection to Payload's design tokens. The editor interior (syntax colors, gutter, selection, cursor) uses Monaco defaults while the wrapper uses Payload tokens.

**Recommended fix**: Define custom Monaco themes via `monaco.editor.defineTheme()` that read CSS custom properties at mount time via `getComputedStyle`. Create a `themes.ts` file in `elements/CodeEditor/` that maps editor colors (`editor.background`, `editor.foreground`, `editorGutter.background`, etc.) and syntax token colors to existing design token CSS vars. Re-resolve on theme switch.

**File**: `packages/ui/src/elements/CodeEditor/CodeEditor.tsx` (line 79)

**Why not pure CSS overrides**: Monaco uses inline styles that take precedence — would need `!important` everywhere, fragile to Monaco updates, and can't control syntax token colors.

## Code Field `!important`

`packages/ui/src/fields/Code/index.css` uses `!important` on the error textarea border to override Monaco inline styles. Should be resolved by the Monaco theme work above.

## CodeEditor SCSS Not Yet Migrated

`packages/ui/src/elements/CodeEditor/index.scss` still uses SCSS (`@include formInput`). Migrate to CSS after the Monaco theme work.

## Native CSS Nesting — No BEM Concatenation

Native CSS nesting does NOT support BEM-style `&` concatenation like SCSS. In native CSS, `&` desugars to `:is(parent)`, so:

```css
/* BROKEN — produces :is(.btn)--primary which is invalid */
.btn {
  &--primary {
    color: red;
  }
  &__icon {
    width: 16px;
  }
}

/* CORRECT — use flat selectors for BEM modifiers/elements */
.btn--primary {
  color: red;
}
.btn__icon {
  width: 16px;
}
```

Pseudo-class nesting (`&:hover`, `&::before`, `&.class-name`) works fine.

All migrated CSS files have been updated to use flat selectors. Any future CSS files must follow this pattern — never use `&--` or `&__` inside a parent rule.
