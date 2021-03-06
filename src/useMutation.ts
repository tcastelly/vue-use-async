import {
  computed,
  ComputedRef,
  isRef,
  ref,
  Ref,
} from '@vue/composition-api';
import Deferred from '@/Deferred';
import { UnwrappedPromiseType } from './index';

type OnErrorCb = (e: Error, params: any) => any;

type OnEndCb <T> = (res: T, params: any) => any;

function useMutation<T>(
  func: (...any) => Promise<T>,
): {
  mutate: (params: Ref<any> | any) => Promise<UnwrappedPromiseType<typeof func>>,
  onError: (cb: OnErrorCb) => any,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>>) => any,
  isPending: Ref<boolean>,
  error: Ref<Error | null>,
  data: Ref<UnwrappedPromiseType<typeof func>>;
  promise: ComputedRef<Promise<T>>,
} {
  const isPending = ref();

  const data = ref<T>();

  const error = ref<Error | null>();

  const onErrorList = [];

  const onEndList = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  const mutate = (params) => {
    const wrapParams: Ref<any> = isRef(params) ? params : ref(params);

    d.value = new Deferred();

    isPending.value = true;
    error.value = null;

    // it's possible to pass multiple args by using an array as params
    const p = Array.isArray(wrapParams.value)
      ? func.call(null, ...wrapParams.value)
      : func(wrapParams.value);

    p.then((res) => {
      data.value = res;
      d.value.resolve(res);
      onEndList.forEach((cb) => cb(data.value, wrapParams.value));
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
