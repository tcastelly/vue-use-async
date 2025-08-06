import type { Ref } from 'vue';
import {
  computed, onBeforeUnmount, ref, watch,
} from 'vue';

export default function (isPending: Ref<undefined | boolean>, minDuration = 400) {
  const isPendingSpinner = ref(false);

  let timeoutId: ReturnType<typeof setTimeout>;

  let lastDuration = 0;

  watch(
    () => isPending.value,
    (v) => {
      if (v) {
        lastDuration = Date.now();
        isPendingSpinner.value = v;
      }

      // wait before stop spinner
      if (v === false && lastDuration > 0) {
        const diff = Date.now() - lastDuration;
        clearTimeout(timeoutId);

        if (diff > minDuration) {
          isPendingSpinner.value = v;
        } else {
          timeoutId = setTimeout(() => {
            isPendingSpinner.value = v;
          }, minDuration - diff);
        }
      }
    },
    {
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    clearTimeout(timeoutId);
  });

  return computed(() => isPendingSpinner.value);
}
