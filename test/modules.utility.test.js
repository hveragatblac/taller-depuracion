import assert from 'node:assert';
import { describe, it } from 'node:test';
import { is_main_module } from '../src/utilities/modules.utility.js';

describe('utilities/modules', () => {
  describe('is_main_module()', () => {
    it('should evaluate current module as main module', () => {
      const is_main = is_main_module(import.meta);
      assert.ok(is_main);
    });

    it('should evaluate another module as non-main module', () => {
      const meta = { ...import.meta };
      meta.dirname += 'dummy';
      meta.filename += 'dummy';
      meta.url += 'dummy';
      const is_non_main = !is_main_module(meta);
      assert.ok(is_non_main);
    });
  });
});
