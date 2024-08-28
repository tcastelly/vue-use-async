import { computed, Ref, watch } from 'vue';
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
  input: Ref<T>,
  defaultRes: NonNullable<Z>,
  map: (r: Res<T, Z>) => NonNullable<U> = (a: any) => a,
): Ref<U> {
  // map has to be applied only if async data changed
  watch(
    () => input.value,
    (v) => {
      if (v !== undefined && !(v instanceof Result)) {
        input.value = new Result(map?.(v as Res<T, Z>)) as typeof input.value;
      }
    },
  );

  return computed<any>({
    get: () => {
      let v;
      if (input.value instanceof Result) {
        v = input.value.value;
      } else {
        v = input.value;
      }

      return v === undefined ? defaultRes : v;
    },
    set: (v: typeof input.value) => {
      input.value = new Result(v) as typeof input.value;
    },
  });
}
