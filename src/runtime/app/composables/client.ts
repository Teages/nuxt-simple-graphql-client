import type { MaybeRefOrGetter } from '#imports'
import type { BuildInClientOptions } from '../../shared/utils/build-in'
import type { DefineAsyncQuery, DefineOperation, DefineSubscription, OperationClient, UseGraphQLClientOptions, UseGraphQLClientResult, UseSubscriptionOptions } from '../../types/app/composables/client'
import type { ResultOf, TypedDocumentNode, VariablesOf } from '../../types/graphql'
import type { GraphQLClient, GraphQLSubscriptionClient, GraphQLSubscriptionController } from '~/src/runtime/types/client'
import { useAsyncData } from '#app/composables/asyncData'
import { computed, ref, shallowReadonly, shallowRef, toValue, useId, watch } from '#imports'
import { createBuildInClient, createBuildInSSEClient, createBuildInWSClient } from '../../shared/utils/build-in'
import { getDocumentType } from '../../shared/utils/graphql'

export function useGraphQLClient<
  ClientContext = BuildInClientOptions,
  SubscriptionContext = Record<string, never>,
>(
  endpoint: string,
  options?: UseGraphQLClientOptions<ClientContext, SubscriptionContext>,
): UseGraphQLClientResult<ClientContext, SubscriptionContext> {
  if (!endpoint) {
    throw new Error('Endpoint is required')
  }

  const client = typeof options?.handler === 'function'
    ? options.handler(endpoint)
    : createBuildInClient(endpoint, {
      ofetch: $fetch as any,
      ...options?.handler,
    }) as GraphQLClient<ClientContext>

  const subscriptionClient: GraphQLSubscriptionClient<SubscriptionContext> | null = (() => {
    if (!import.meta.browser) {
      return null
    }

    if (typeof options?.subscription?.handler === 'function') {
      return options.subscription.handler(endpoint)
    }

    if (options?.subscription?.handler === 'ws') {
      return createBuildInWSClient(endpoint, options.subscription.options) as GraphQLSubscriptionClient<SubscriptionContext>
    }

    return createBuildInSSEClient(endpoint, options?.subscription?.options) as GraphQLSubscriptionClient<SubscriptionContext>
  })()

  const query: OperationClient<ClientContext> = (document: TypedDocumentNode<any, any>, variables?: any, context?: ClientContext) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error(`Expected a query operation, but got a ${type} operation.`)
    }

    return client({ document, variables }, context)
  }

  const mutation: OperationClient<ClientContext> = (document: TypedDocumentNode<any, any>, variables?: any, context?: ClientContext) => {
    const type = getDocumentType(document)
    if (type !== 'mutation') {
      throw new Error(`Expected a mutation operation, but got a ${type} operation.`)
    }

    return client({ document, variables }, context)
  }

  const defineOperation: DefineOperation<ClientContext> = (document, context) => {
    const type = getDocumentType(document)
    if (type === 'subscription') {
      throw new Error('Subscriptions are not supported')
    }

    return (variables?: any, contextRewrite?: any) => client(
      { document, variables },
      { ...context, ...contextRewrite },
    )
  }

  const defineAsyncQuery: DefineAsyncQuery<ClientContext> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error('Operation is not a query.')
    }

    return (
      variables?: MaybeRefOrGetter<VariablesOf<typeof document>>,
      options?: any,
    ) => {
      const key = useId()

      return useAsyncData(
        key,
        () => client(
          {
            document,
            variables: toValue(variables) ?? {} as VariablesOf<typeof document>,
          },
          { ...context, ...options?.context },
        ),
        options,
      )
    }
  }

  const defineLazyAsyncQuery: DefineAsyncQuery<ClientContext> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error('Operation is not a query.')
    }

    return (
      variables?: MaybeRefOrGetter<VariablesOf<typeof document>>,
      options?: any,
    ) => {
      const key = useId()

      return useAsyncData(
        key,
        () => client(
          {
            document,
            variables: toValue(variables) ?? {} as VariablesOf<typeof document>,
          },
          { ...context, ...options?.context },
        ),
        {
          lazy: true,
          ...options,
        },
      )
    }
  }

  const defineSubscription: DefineSubscription<SubscriptionContext> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'subscription') {
      throw new Error('Operation is not a subscription')
    }

    return (
      variables?: MaybeRefOrGetter<VariablesOf<typeof document>>,
      { immediate, autoConnect, contextRewrite }: UseSubscriptionOptions<SubscriptionContext> = {},
    ) => {
      const data = shallowRef<ResultOf<typeof document> | null | undefined>(undefined)
      const status = ref<'connecting' | 'open' | 'closed'>('closed')
      const errors = shallowRef<ReadonlyArray<import('graphql').GraphQLFormattedError> | null>(null)

      const varsRef = computed(() => toValue(variables) ?? {} as VariablesOf<typeof document>)
      const lock = shallowRef<number>(0)
      const connCtl = shallowRef<GraphQLSubscriptionController | undefined>(undefined)

      const close = () => {
        status.value = 'closed'
        connCtl.value?.close()
      }

      const init = () => {
        data.value = undefined
        errors.value = null
        status.value = 'connecting'
        lock.value += 1

        if (!subscriptionClient) {
          return
        }

        const id = lock.value
        connCtl.value = subscriptionClient(
          { document, variables: varsRef.value },
          {
            next: (received) => {
              if (id !== lock.value) {
                return
              }

              if (status.value === 'connecting') {
                status.value = 'open'
              }
              data.value = received.data || null
              errors.value = received.errors || null
            },
            error: (error) => {
              console.error(error)
              if (id !== lock.value) {
                return
              }
              status.value = 'closed'
            },
            complete: () => {
              if (id !== lock.value) {
                return
              }
              status.value = 'closed'
            },
          },
          { ...context, ...contextRewrite } as SubscriptionContext,
        )
      }
      const open = () => {
        close()
        init()
      }

      if (immediate) {
        open()
      }

      if (autoConnect) {
        watch(varsRef, open, { deep: true })
      }

      return {
        data,
        status: shallowReadonly(status),
        errors,
        close,
        open,
      }
    }
  }

  return {
    query,
    mutation,
    defineOperation,
    defineAsyncQuery,
    defineLazyAsyncQuery,
    defineSubscription,
  }
}
