import {
  watch,
  computed,
  ref,
  Ref,
} from 'vue';

export default function (isPending: Ref<undefined | boolean>, duration = 400) {
  const isPendingSpinner = ref<boolean>(false);

  let timeoutId: ReturnType<typeof setTimeout>;

  watch(
    () => isPending.value,
    () => {
      // wait before stop spinner
      if (isPendingSpinner.value && !isPending.value) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          isPendingSpinner.value = isPending.value === true;
        }, duration);
      } else {
        isPendingSpinner.value = isPending.value === true;
      }
    }, {
      immediate: true,
    },
  );

  return computed(() => isPendingSpinner.value);
}
