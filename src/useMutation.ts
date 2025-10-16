import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';
import type { Obj, UnwrappedPromiseType } from '.';

type TypeAllowed = undefined | boolean | null | string | number | Obj;

type OnErrorCb<E = Error, Z = unknown, A extends TypeAllowed[] = any> = (e: null | E, params: A extends [] ? Z : [Z, ...A]) => unknown;

type OnEndCb<T, Z, A extends TypeAllowed[]> = (res: T, params: A extends [] ? Z : [Z, ...A]) => unknown;

export default function useMutation<T, Z extends TypeAllowed, A extends TypeAllowed[], E = Error>(
  func: (arg: Z, ...args: A) => Promise<T>,
): {
    mutate: (param?: Z, ...restParams: A) => Promise<UnwrappedPromiseType<typeof func>>;
    onError: (cb: OnErrorCb<E, Z, A>) => unknown;
    onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>, Z, A>) => unknown;
    isPending: Ref<boolean>;
    error: Ref<null | E>;
    data: Ref<UnwrappedPromiseType<typeof func>>;
    promise: ComputedRef<null | Promise<T>>;
  } {
  const isPending = ref();

  const data = ref<T>() as Ref<T>;

  const error = ref<null | E>() as Ref<null | E>;

  const onErrorList: OnErrorCb<E, Z, A>[] = [];

  const onEndList: OnEndCb<T, Z, A>[] = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<null | Promise<T>>(null);

  const mutate = (param?: Z, ...params: A) => {
    isPending.value = true;
    error.value = null;

    // it's possible to pass multiple args by using an array as params
    const funcRes = func as (...args: TypeAllowed[]) => Promise<T>;
    d.value = funcRes(...[param, ...params]);

    d.value.catch((_error) => {
      error.value = _error || null;

      onErrorList.forEach((cb) => cb(
        error.value,
        // @ts-ignore - how test `Z extends []`?
        params.length ? [param, ...params] : param,
      ));

      error.value = _error;
    });

    d.value.then((res) => {
      data.value = res;
      onEndList.forEach((cb: OnEndCb<T, Z, A>) => cb(
        data.value,
        // @ts-ignore - how test `Z extends []`?
        params.length ? [param, ...params] : param,
      ));
    });

    d.value.finally(() => {
      isPending.value = false;
    });

    return d.value;
  };

  return {
    mutate,
    onError: (cb) => onErrorList.push(cb),
    onEnd: (cb) => onEndList.push(cb),
    isPending,
    error,
    data,
    promise: computed(() => d.value),
  };
}

export function useMutationWithError<E>() {
  // Returns a function that accepts the actual async function
  return function <T, Z extends TypeAllowed, A extends TypeAllowed[]>(
    func: (arg: Z, ...args: A) => Promise<T>,
  ) {
    return useMutation<T, Z, A, E>(func);
  };
}
