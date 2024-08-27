import type { Ref } from 'vue';
import {
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue';
import uuid from '@/_base/uuid';

type NonNullable<T> = Exclude<T, null | undefined>;

type Res<T, Z extends T> = NonNullable<Z extends never[] ? T : Z>;

export class Result<T> {
  constructor(v: T) {
    this.uuid = uuid;
    this.value = v;
  }

  value: T;

  uuid: string;
}

export default function <T, Z extends T, U = Res<T, Z>>(
  res: Ref<T>,
  defaultRes: NonNullable<Z>,
  map?: (r: Res<T, Z>) => NonNullable<U>,
): Ref<U> {
  const _res = ref<any>(defaultRes);

  if (!map) {
    map = (a: any) => a;
  }

  if (defaultRes !== undefined) {
    _res.value = map(defaultRes as Res<T, Z>);
  }

  watchEffect(async () => {
    if (res) {
      const unWrapRes = unref<any>(res);

      if (unWrapRes !== undefined) {
        _res.value = map?.(unWrapRes);
      }
    }
  });

  watch(
    () => _res.value,
    (v) => {
      if (v === undefined || res.value === undefined || v === _res.value) {
        return;
      }

      if (JSON.stringify(v) !== JSON.stringify(_res.value)) {
        // @ts-ignore
        res.value = new Result(v);
      }
    },
  );

  return _res;
}
