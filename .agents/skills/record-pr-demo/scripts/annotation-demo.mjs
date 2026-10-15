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
`

export function createAnnotationInteraction({ page, presentation }) {
  if (presentation) {
    return {
      hideAnnotation: presentation.clearAnnotation,
      showAnnotation: async ({ body, index = 1, total = 1, title, type = 'panel' }) => {
        if (!['panel', 'floating'].includes(type)) {
          throw new Error('Annotation type must be panel or floating')
        }
        await presentation.setAnnotation({
          body,
          index,
          total,
          title: title ?? (type === 'floating' ? 'Note' : undefined),
        })
      },
    }
  }
  return {
    hideAnnotation: async () => {
      await page.evaluate(() => {
        document.querySelector('[data-pr-demo-annotation]')?.remove()
      })
    },
    showAnnotation: async ({ body, position, title, type, width }) => {
      if (type !== 'floating') {
        throw new Error('Annotation type must be floating')
      }
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

      await page.evaluate(
        ({ body, position, styles, title, type, width }) => {
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

          for (const [edge, value] of Object.entries(position)) {
            annotation.style[edge] = `${value}px`
          }
          if (width !== undefined) annotation.style.width = `${width}px`
          addText(annotation, 'pr-demo-annotation-title', title)
          addText(annotation, 'pr-demo-annotation-body', body)

          document.body.append(annotation)
          annotation.showPopover()
        },
        {
          body,
          position,
          styles: ANNOTATION_STYLES,
          title,
          type,
          width,
        },
      )
    },
  }
}
