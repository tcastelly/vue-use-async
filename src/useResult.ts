import {
  Ref,
  ref,
  unref,
  watchEffect,
} from 'vue';

type NonNullable<T> = Exclude<T, null | undefined>;

export default function <T, Z extends T>(res: Ref<T>, defaultRes: Z): Ref<NonNullable<Z>> {
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

  return _res as Ref<NonNullable<Z>>;
}
