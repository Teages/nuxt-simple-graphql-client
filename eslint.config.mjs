// @ts-check
import antfu from '@antfu/eslint-config'
import { createConfigForNuxt } from '@nuxt/eslint-config'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    standalone: false,
    tooling: false, // managed by antfu's config
  },
  dirs: {
    src: ['./playground'],
  },
})
  .append(
    antfu({
      rules: {
        curly: ['error', 'all'],
      },
    }),
  )
