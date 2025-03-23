<script setup lang="ts">
const endpoint = 'http://localhost:64961/graphql'
const gqfn = useGQFnSchema(endpoint)

const {
  defineSubscription,
} = useGraphQLClient(endpoint, { subscription: { handler: 'sse' } })

const useCountdown = defineSubscription(
  gqfn('subscription', [{
    countdown: $ => $({ from: 3 }, true),
  }]),
)

const { data, status, open: reset } = useCountdown(undefined, { immediate: false })
const num = computed(() => data.value?.countdown ?? 0)
</script>

<template>
  <div>
    <code data-testid="countdown-value">SSE Countdown: {{ num }}</code>
    <code data-testid="status">SSE Status: {{ status }}</code>
    <button id="reset-btn" @click="reset">
      Reset
    </button>
  </div>
</template>
