import type { AsyncData, AsyncDataOptions, KeysOf, PickFrom } from '#app/composables/asyncData'
import type { MaybeRefOrGetter } from '#imports'
import type { Ref, ShallowRef } from 'vue'
import type { TypedDocumentNode } from '../../graphql'
import type { BuildInClientOptions, BuildInSSEClientOptions, BuildInWSClientOptions } from '~/src/runtime/shared/utils/build-in'
import type { GraphQLClientBuilder, GraphQLSubscriptionClientBuilder } from '~/src/runtime/types/client'

export type UseGraphQLSubscriptionClientOptions<SubscriptionContext> =
  | {
    /**
     * Override the default subscription handler.
     * By default it use EventSource
     * - `GraphQLSubscriptionClientBuilder`: your custom subscription handler
     * - `ws`: use handler from `graphql-ws`
     * - `sse`: use handler from `graphql-sse` (default)
     *
     * @default 'sse'
     */
    handler?: 'sse'
    options?: BuildInSSEClientOptions
  }
  | {
    /**
     * Override the default subscription handler.
     * By default it use EventSource
     * - `GraphQLSubscriptionClientBuilder`: your custom subscription handler
     * - `ws`: use handler from `graphql-ws`
     * - `sse`: use handler from `graphql-sse` (default)
     *
     * @default 'sse'
     */
    handler: 'ws'
    options?: BuildInWSClientOptions
  }
  | {
    /**
     * Override the default subscription handler.
     * By default it use EventSource
     * - `GraphQLSubscriptionClientBuilder`: your custom subscription handler
     * - `ws`: use handler from `graphql-ws`
     * - `sse`: use handler from `graphql-sse` (default)
     *
     * @default 'sse'
     */
    handler: GraphQLSubscriptionClientBuilder<SubscriptionContext>
  }
export interface UseGraphQLClientOptions<
  ClientContext,
  SubscriptionContext,
> {
  handler?: GraphQLClientBuilder<ClientContext> | BuildInClientOptions
  subscription?: UseGraphQLSubscriptionClientOptions<SubscriptionContext>
}

export interface UseGraphQLClientResult<ClientContext, SubscriptionContext> {
  query: OperationClient<ClientContext>
  mutation: OperationClient<ClientContext>
  defineOperation: DefineOperation<ClientContext>
  defineAsyncQuery: DefineAsyncQuery<ClientContext>
  defineLazyAsyncQuery: DefineAsyncQuery<ClientContext>
  defineSubscription: DefineSubscription<SubscriptionContext>
}

type OperationClientParams<TVars, Context> =
  Record<string, never> extends TVars
    ? [variables?: TVars, context?: Context]
    : [variables: TVars, context?: Context]
export interface OperationClient<Context> {
  <
    TData = Record<string, any>,
    TVars = Record<string, any>,
  >(
    query: TypedDocumentNode<TData, TVars>,
    ...params: OperationClientParams<TVars, Context>
  ): Promise<TData>
}

export interface DefineOperation<Context> {
  <TData, TVars extends Record<string, unknown>>(
    document: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineOperationReturn<Promise<TData>, TVars, Context>
}
export type DefineOperationReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, context?: Context) => Ret
    : (variables: TVars, context?: Context) => Ret

export interface DefineAsyncQuery<Context> {
  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
  > (
    document: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineAsyncQueryReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >

  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = DataT,
  > (
    document: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineAsyncQueryReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >
}

export type DefineAsyncQueryReturn<Ret, TVars, Options> =
  Record<string, never> extends TVars
    ? DefineAsyncQueryReturnFnE<Ret, TVars, Options>
    : DefineAsyncQueryReturnFn<Ret, TVars, Options>
export interface DefineAsyncQueryReturnFn<Ret, TVars, Options> {
  (
    variables: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables: RequireRefOrGetter<TVars>,
    options?: Options
  ): Ret
}
export interface DefineAsyncQueryReturnFnE<Ret, TVars, Options> {
  (
    variables?: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables?: RequireRefOrGetter<TVars>,
    options?: Options
  ): Ret
}

export interface DefineSubscription<Context> {
  <TData, TVars extends Record<string, unknown>>(
    document: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineSubscriptionReturn<TData, TVars, Context>
}
export interface UseSubscriptionOptions<Context> {
  /**
   * Immediately open the connection when calling this composable.
   *
   * @default false
   */
  immediate?: boolean

  /**
   * Automatically reconnect when variables changed.
   */
  autoConnect?: boolean

  contextRewrite?: Partial<Context>
}
export type DefineSubscriptionReturn<TData, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: MaybeRefOrGetter<TVars>, options?: UseSubscriptionOptions<Context>) => SubscriptionReturn<TData>
    : (variables: MaybeRefOrGetter<TVars>, options?: UseSubscriptionOptions<Context>) => SubscriptionReturn<TData>

export interface SubscriptionReturn<TData> {
  data: ShallowRef<TData | null | undefined>
  status: Readonly<Ref<'connecting' | 'open' | 'closed'>>
  errors: ShallowRef<ReadonlyArray<import('graphql').GraphQLFormattedError> | null>
  close: () => void
  /**
   * Reopen the subscription connection.
   * If the connection is already open, it will close before opening a new.
   */
  open: () => void
}

type RequireRefOrGetter<T = any> =
  0 extends 1 & T
    ? MaybeRefOrGetter<T>
    : Exclude<MaybeRefOrGetter<T>, T>
