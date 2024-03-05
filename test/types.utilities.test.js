import assert from 'node:assert';
import { describe, it } from 'node:test';
import { is_nil } from '../src/utilities/types.utility.js';

describe('utilities/types', () => {
  describe('is_nil()', () => {
    it('should evaluate null as nil', () => {
      const is_nil_value = is_nil(null);
      assert.ok(is_nil_value);
    });

    it('should evaluate undefined as nil', () => {
      const is_nil_value = is_nil(undefined);
      assert.ok(is_nil_value);
    });

    it('should evaluate object as non-nil', () => {
      const is_non_nil_value = !is_nil({});
      assert.ok(is_non_nil_value);
    });

    it('should evaluate number as non-nil', () => {
      const is_non_nil_value = !is_nil(0);
      assert.ok(is_non_nil_value);
    });

    it('should evaluate string as non-nil', () => {
      const is_non_nil_value = !is_nil('');
      assert.ok(is_non_nil_value);
    });

    it('should evaluate symbol as non-nil', () => {
      const is_non_nil_value = !is_nil(Symbol('dummy'));
      assert.ok(is_non_nil_value);
    });

    it('should evaluate bigint as non-nil', () => {
      const is_non_nil_value = !is_nil(0n);
      assert.ok(is_non_nil_value);
    });

    it('should evaluate boolean as non-nil', () => {
      const is_non_nil_value = !is_nil(false);
      assert.ok(is_non_nil_value);
    });
  });
});
