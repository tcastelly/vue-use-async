import useResult from '@/useResult';
import { ref } from 'vue';

describe('GIVEN useResult', () => {
  const resMaybeNullable = ref<undefined | null | number[]>();

  const res = useResult(resMaybeNullable, []);
  it('THEN res should not nullable', () => {
    expect(Array.isArray(res.value)).toBe(true);
    expect(res.value.length).toBeFalsy();
  });
});
