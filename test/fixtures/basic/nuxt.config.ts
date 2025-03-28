import module from '../../../src/module'

export default defineNuxtConfig({
  modules: ['@gqfn/nuxt', module],
  gqfn: {
    clients: [
      'https://graphql-test.teages.xyz/graphql-user',
    ],
  },
})
