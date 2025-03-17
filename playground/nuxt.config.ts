export default defineNuxtConfig({
  modules: ['@gqfn/nuxt', '../src/module'],

  gqfn: {
    clients: [
      'https://graphql-test.teages.xyz/graphql-user',
    ],
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-17',
})