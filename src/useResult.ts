import {
  Ref,
  ref,
  unref,
  watchEffect,
} from 'vue';

export default function <T>(res: Ref<T>, defaultRes: T): Ref<T> {
  const _res = ref<T>();

  if (defaultRes) {
    _res.value = defaultRes;
  }

  watchEffect(() => {
    if (res) {
      const unWrapRes = unref(res);

      if (unWrapRes) {
        _res.value = unWrapRes;
      }
    }
  });

  return _res;
}
