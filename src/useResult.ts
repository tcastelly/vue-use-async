import {
  Ref,
  ref,
  unref,
  watchEffect,
} from 'vue';

type NonNullable<T> = Exclude<T, null | undefined>;

type Res<T, Z extends T> = NonNullable<Z extends never[] ? T : Z>;

export default function <T, Z extends T, U = Res<T, Z>>(
  res: Ref<T>,
  defaultRes: NonNullable<Z>,
  map?: (r: Res<T, Z>) => NonNullable<U>,
): Ref<U> {
  const _res = ref<any>(defaultRes);

  if (!map) {
    map = (a: any) => a;
  }

  if (defaultRes) {
    _res.value = map(defaultRes as Res<T, Z>);
  }

  watchEffect(() => {
    if (res) {
      const unWrapRes = unref<any>(res);

      if (unWrapRes) {
        _res.value = map?.(unWrapRes);
      }
    }
  });

  return _res;
}
