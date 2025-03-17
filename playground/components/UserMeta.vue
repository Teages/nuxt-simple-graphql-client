<script lang="ts">
const { schema } = helloApi

export type RequireUserFragment = RequireOperationPartialData<typeof UserFragment>

/**
 * Same as:
 * ```graphql
 * fragment UserFragment on User {
 *   name
 *   id
 * }
 * ```
 */
export const UserFragment = schema
  .partial('fragment UserFragment', 'on User', [
    'name',
    'id',
  ])
</script>

<script setup lang="ts">
const { user } = defineProps<{
  user: RequireUserFragment
}>()
</script>

<template>
  <div>
    user: {{ user.name }} ({{ user.id }})
  </div>
</template>
