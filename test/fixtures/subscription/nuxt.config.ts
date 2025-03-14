import module from '../../../src/module'

export default defineNuxtConfig({
  modules: ['@gqfn/nuxt', module],
  gqfn: {
    clients: [
      'http://localhost:64961/graphql',
    ],
  },
})
