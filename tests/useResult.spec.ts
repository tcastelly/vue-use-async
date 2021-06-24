import useResult from '@/useResult';
import { ref } from 'vue';

describe('GIVEN useResult', () => {
  const resMaybeNullable = ref<undefined | null | number[]>();

  const res = useResult(resMaybeNullable, []);
  it('THEN res should not nullable', () => {
    expect(Array.isArray(res.value)).toBe(true);
    expect(res.value.length).toBeFalsy();
  });

  describe('WHEN using inheritance', () => {
    // backend return only ID
    const resA = ref<undefined | null | { id: number }>();

    // client part need to extend with a label
    const resB = useResult(resA, { id: 0, label: '' });
    it('THEN extended property should not be in error', () => {
      expect(resB.value.id).toBe(42);
      expect(resB.value.label).toBe('foo');
    });
  });
});
