import {
  computed, ComputedRef, ref, Ref,
} from 'vue';
import Deferred from '@/Deferred';
import type { Obj, UnwrappedPromiseType } from './index';

type TypeAllowed = undefined | boolean | null | string | number | Obj

type OnErrorCb = (e: null | Error) => unknown;

type OnEndCb<T, Z, A extends TypeAllowed[]> = (res: T, params: A extends [] ? Z : [Z, ...A]) => unknown;

export default function useMutation<T, Z, A extends TypeAllowed[]>(
  func: (arg: Z, ...args: A) => Promise<T>,
): {
  mutate: (param: Z, ...restParams: A) => Promise<UnwrappedPromiseType<typeof func>>,
  onError: (cb: OnErrorCb) => unknown,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>, Z, A>) => unknown,
  isPending: Ref<boolean>,
  error: Ref<null | Error>,
  data: Ref<UnwrappedPromiseType<typeof func>>;
  promise: ComputedRef<Promise<T>>,
} {
  const isPending = ref();

  const data = ref<T>() as Ref<T>;

  const error = ref<null | Error>() as Ref<null | Error>;

  const onErrorList: OnErrorCb[] = [];

  const onEndList: OnEndCb<T, Z, A>[] = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  const mutate = (param: Z, ...params: A) => {
    d.value = new Deferred();

    isPending.value = true;
    error.value = null;

    // it's possible to pass multiple args by using an array as params
    const funcRes = func as (...args: TypeAllowed[]) => Promise<T>;
    const p = funcRes(...[param, ...params]);

    p.then((res) => {
      data.value = res;
      d.value.resolve(res);
      onEndList.forEach((cb: OnEndCb<T, Z, A>) => cb(
        data.value,
        // @ts-ignore - how test `Z extends []`?
        params.length ? [param, ...params] : param,
      ));
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
