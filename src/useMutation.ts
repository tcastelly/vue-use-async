import {
  computed,
  ComputedRef,
  ref,
  Ref,
  unref,
} from 'vue';
import Deferred from '@/Deferred';
import type { UnwrappedPromiseType } from './index';

type OnErrorCb = (e: null | Error) => unknown;

type OnEndCb<T, A> = (res: T, params: A) => unknown;

function useMutation<A, T>(
  func: (...args: A[]) => Promise<T>,
): {
  mutate: (params: ComputedRef<A> | Ref<A> | A) => Promise<UnwrappedPromiseType<typeof func>>,
  onError: (cb: OnErrorCb) => unknown,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>, A>) => unknown,
  isPending: Ref<boolean>,
  error: Ref<null | Error>,
  data: Ref<UnwrappedPromiseType<typeof func>>;
  promise: ComputedRef<Promise<T>>,
} {
  const isPending = ref();

  const data = ref<T>() as Ref<T>;

  const error = ref<null | Error>() as Ref<null | Error>;

  const onErrorList: OnErrorCb[] = [];

  const onEndList: OnEndCb<T, A>[] = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  const mutate = (params: ComputedRef<A> | Ref<A> | A) => {
    const unwrapParams = unref(params) as A;

    d.value = new Deferred();

    isPending.value = true;
    error.value = null;

    // it's possible to pass multiple args by using an array as params
    const p = Array.isArray(unwrapParams)
      ? func.call(null, ...unwrapParams)
      : func(unwrapParams);

    p.then((res) => {
      data.value = res;
      d.value.resolve(res);
      onEndList.forEach((cb) => cb(data.value, unwrapParams));
    }, (_error) => {
      error.value = _error || null;

      onErrorList.forEach((cb) => cb(error.value));

      d.value.reject(_error);
      error.value = _error;
    });

    p.finally(() => {
      isPending.value = false;
    });

    return p;
  };

  return {
    mutate,
    onError: (cb) => onErrorList.push(cb),
    onEnd: (cb) => onEndList.push(cb),
    isPending,
    error,
    data,
    promise: computed(() => d.value.promise),
  };
}

export default useMutation;
