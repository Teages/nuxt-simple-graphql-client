<script setup lang="ts">
import { UserFragment } from '~/components/UserMeta.vue'

const { client, schema } = helloApi

const nameList = ['Alice', 'Bob', 'Charlie', 'Teages']
const index = ref(0)
const params = computed(() => ({ name: nameList[index.value % nameList.length] }))
const { data: msg } = await useAsyncHello(params, { watch: [params] })

/**
 * Same as:
 * ```graphql
 * query QueryUser($id: ID!) {
 *   user(id: $id) {
 *   ...UserFragment
 * }
 * ```
 */
const { data, error } = await useAsyncData(() => client.query(
  schema('query QueryUser', { id: 'ID!' }, [{
    user: $ => $({ id: $.id }, [{
      ...UserFragment($),
    }]),
  }]),
  { id: '1' },
))
</script>

<template>
  <div>
    {{ msg?.hello }}
    <button @click="index += 1">
      Change
    </button>
  </div>
  <div v-if="data?.user">
    <UserMeta :user="data.user" />
  </div>
  <div v-else-if="error">
    Error: {{ error }}
  </div>
  <div v-else>
    Loading...
  </div>
</template>
