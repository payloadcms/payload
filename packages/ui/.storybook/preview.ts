import type { Preview } from '@storybook/react-vite'

// Import global styles for all stories
import '../src/scss/app.scss'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
