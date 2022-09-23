import {
  computed,
  ComputedRef,
  Ref,
  ref,
  unref,
  watch,
} from 'vue';
import type { TypeAllowed, UnwrappedPromiseType } from './index';

type OnErrorCb<T> = (e: null | Error, params: T) => unknown;

type OnStartCb<T> = (params: T) => unknown;

type OnEndCb<T, Z> = (res: T, params: Z) => unknown;

// params: ComputedRef<A> | Ref<A> | (() => A) | A = {} as A,

type Params<Z, A extends unknown[]> = (() => (Z | [...A])) |
  ComputedRef<Z | [...A]> |
  Ref<Z | [...A]> |
  Z |
  [...A]

export default function useAsync<T, Z extends TypeAllowed, A extends TypeAllowed[]>(
  func: ((...args: A) => Promise<T>) | ((args: Z) => Promise<T>),
  params?: Params<Z, A>,
  enabled: Ref<boolean> | (() => boolean) = ref(true),
): {
  isPending: Ref<undefined | boolean>,
  data: Ref<undefined | null | UnwrappedPromiseType<typeof func>>;
  error: Ref<null | Error>,
  reload: () => unknown,
  onError: (cb: OnErrorCb<Params<Z, A>>) => unknown,
  onStart: (cb: OnStartCb<Params<Z, A>>) => unknown,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>, Params<Z, A>>) => unknown,
  promise: ComputedRef<null | ReturnType<typeof func>>,
} {
  const isPending = ref<undefined | boolean>();

  const data = ref<T>() as Ref<T>;

  const error: Ref<null | Error> = ref(null);

  const onErrorList: Array<OnErrorCb<Params<Z, A>>> = [];

  const onStartList: Array<OnStartCb<Params<Z, A>>> = [];

  const onEndList: Array<OnEndCb<T, Params<Z, A>>> = [];

  // for legacy use case
  const d = ref<null | Promise<T>>(null);

  const wrapParams = computed(() => {
    if (typeof params === 'function') {
      return params();
    }
    return unref(params);
  });

  const lastUnwrapParams = ref();

  const _enabled = computed(() => {
    if (typeof enabled === 'function') {
      return enabled();
    }
    return unref(enabled);
  });

  // generate new xhr/promise
  const _reload = (_params: Z | [...A]) => {
    onStartList.forEach((cb) => cb(wrapParams.value));

    isPending.value = true;
    error.value = null;

    // possible to call with rest params
    const funcDefault = func as ((args: Z) => Promise<T>);

    // call with only one param
    const funcRest = func as ((...args: A) => Promise<T>);

    // it's possible to pass multiple args by using an array as params
    d.value = Array.isArray(_params)
      ? funcRest(..._params)
      : funcDefault(_params);

    d.value.catch((_error) => {
      error.value = _error || null;

      onErrorList.forEach((cb) => cb(error.value, wrapParams.value));

      error.value = _error;
    });

    d.value.then((res) => {
      data.value = res;

      onEndList.forEach((cb) => cb(res, wrapParams.value));
    });

    d.value.finally(() => {
      isPending.value = false;
    });

    return d.value;
  };

  // reload if the query has been enabled
  watch(
    () => _enabled.value,
    (v) => {
      // we don't want to execute twice if params changed AND exec changed
      if (!isPending.value && v) {
        _reload(wrapParams.value);
      }
    },
    {
      // avoid simultaneously query
      immediate: false,
    },
  );

  watch(
    () => error.value,
    (err) => {
      if (err) {
        throw err;
      }
    },
  );

  watch(
    () => wrapParams.value,
    (v) => {
      const vStr = JSON.stringify(v);
      if (
        !isPending.value
        && (
          // fix if there is no change. Just undefined as value
          (v === undefined && lastUnwrapParams.value === undefined)

          || (_enabled.value && vStr !== JSON.stringify(lastUnwrapParams.value))
        )
      ) {
        _reload(v);
      }
      lastUnwrapParams.value = vStr === undefined ? undefined : JSON.parse(vStr);
    },
    {
      immediate: _enabled.value,
      deep: true,
    },
  );

  return {
    isPending,
    data,
    error,
    reload: () => _reload(wrapParams.value),
    onError: (cb) => onErrorList.push(cb),
    onStart: (cb) => onStartList.push(cb),
    onEnd: (cb) => onEndList.push(cb),
    promise: computed(() => d.value),
  };
}
