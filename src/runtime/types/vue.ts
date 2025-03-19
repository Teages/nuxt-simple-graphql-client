export type RequireRefOrGetter<T = any> =
  0 extends 1 & T
    ? MaybeRefOrGetter<T>
    : Exclude<MaybeRefOrGetter<T>, T>
