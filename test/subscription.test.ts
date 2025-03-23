import { fileURLToPath } from 'node:url'
import { expect, test } from '@nuxt/test-utils/playwright'

test.use({
  nuxt: {
    rootDir: fileURLToPath(new URL('./fixtures/subscription', import.meta.url)),
  },
})

test.describe('Subscription Client', () => {
  test('ws-client', async ({ page, goto }) => {
    await goto('/ws')
    await expect(
      page.getByTestId('countdown-value'),
    ).toHaveText('WS Countdown: 0')

    await page.click('#reset-btn')

    for (let i = 3; i >= 0; i--) {
      await expect(
        page.getByTestId('countdown-value'),
      ).toHaveText(`WS Countdown: ${i}`)
    }
  })

  test('sse-client', async ({ page, goto }) => {
    await goto('/sse')
    await expect(
      page.getByTestId('countdown-value'),
    ).toHaveText('SSE Countdown: 0')

    await page.click('#reset-btn')

    for (let i = 3; i >= 0; i--) {
      await expect(
        page.getByTestId('countdown-value'),
      ).toHaveText(`SSE Countdown: ${i}`)
    }
  })
})
