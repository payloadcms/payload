const ANNOTATION_STYLES = `
  [data-pr-demo-annotation] {
    box-sizing: border-box;
    margin: 0;
    border: 0;
    color: var(--color-text);
    background: var(--color-bg-elevated);
    font-family: var(--font-body);
    pointer-events: none;
    z-index: 2147483646;
  }
  [data-pr-demo-annotation="floating"] {
    position: fixed;
    inset: auto;
    width: max-content;
    max-width: min(340px, calc(100vw - 48px));
    padding: 10px 14px;
    border: var(--stroke-width-small) solid var(--color-border);
    border-radius: var(--radius-medium);
    box-shadow: var(--elevation-300-tooltip);
  }
  [data-pr-demo-annotation="banner"] {
    position: fixed;
    inset: auto 0 0;
    display: flex;
    align-items: center;
    gap: var(--spacer-3);
    width: 100%;
    max-width: none;
    max-height: none;
    padding: var(--spacer-2-5) var(--spacer-4);
    border-block-start: var(--stroke-width-small) solid var(--color-border);
  }
  [data-pr-demo-annotation] .pr-demo-annotation-title {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
  [data-pr-demo-annotation="floating"] .pr-demo-annotation-body {
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-section {
    flex: 1 1 0;
    min-width: 0;
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-section + .pr-demo-annotation-section {
    padding-inline-start: var(--spacer-3);
    border-inline-start: var(--stroke-width-small) solid var(--color-border);
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-body,
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-figure {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
  }
  [data-pr-demo-annotation="banner"] .pr-demo-annotation-figure {
    font-variant-numeric: tabular-nums;
  }
`

export function createAnnotationInteraction({ page }) {
  return {
    hideAnnotation: async () => {
      await page.evaluate(() => {
        document.querySelector('[data-pr-demo-annotation]')?.remove()
      })
    },
    showAnnotation: async ({ body, figure, position, sections, title, type, width }) => {
      if (type === 'floating') {
        if (!body || !position || !Object.keys(position).length) {
          throw new Error('Floating annotations require body text and a position')
        }
        if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
          throw new Error('Floating annotation width must be a positive number')
        }
        for (const [edge, value] of Object.entries(position)) {
          if (!['top', 'right', 'bottom', 'left'].includes(edge) || !Number.isFinite(value)) {
            throw new Error(
              'Floating annotation position must use numeric top, right, bottom, or left',
            )
          }
        }
      } else if (type === 'banner') {
        if (sections !== undefined && (!Array.isArray(sections) || !sections.length)) {
          throw new Error('Banner annotation sections must be a non-empty array')
        }
        if (
          (sections ?? [{ title, body, figure }]).some(
            (section) => !section.title && !section.body && !section.figure,
          )
        ) {
          throw new Error('Each banner section needs a title, body, or figure')
        }
      } else {
        throw new Error('Annotation type must be floating or banner')
      }

      await page.evaluate(
        ({ body, position, sections, styles, title, type, width }) => {
          document.querySelector('[data-pr-demo-annotation]')?.remove()

          if (!document.querySelector('[data-pr-demo-annotation-styles]')) {
            const style = document.createElement('style')
            style.setAttribute('data-pr-demo-annotation-styles', '')
            style.textContent = styles
            document.head.append(style)
          }

          const annotation = document.createElement('aside')
          annotation.setAttribute('aria-hidden', 'true')
          annotation.setAttribute('data-pr-demo-annotation', type)
          annotation.setAttribute('popover', 'manual')

          const addText = (parent, className, value) => {
            if (!value) return
            const element = document.createElement('div')
            element.className = className
            element.textContent = value
            parent.append(element)
          }

          if (type === 'floating') {
            for (const [edge, value] of Object.entries(position)) {
              annotation.style[edge] = `${value}px`
            }
            if (width !== undefined) annotation.style.width = `${width}px`
            addText(annotation, 'pr-demo-annotation-title', title)
            addText(annotation, 'pr-demo-annotation-body', body)
          } else {
            for (const section of sections) {
              const element = document.createElement('div')
              element.className = 'pr-demo-annotation-section'
              addText(element, 'pr-demo-annotation-title', section.title)
              addText(element, 'pr-demo-annotation-body', section.body)
              addText(element, 'pr-demo-annotation-figure', section.figure)
              annotation.append(element)
            }
          }

          document.body.append(annotation)
          annotation.showPopover()
        },
        {
          body,
          position,
          sections: type === 'banner' ? (sections ?? [{ title, body, figure }]) : undefined,
          styles: ANNOTATION_STYLES,
          title,
          type,
          width,
        },
      )
    },
  }
}
