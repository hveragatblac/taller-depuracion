import os from 'node:os';
import { solve } from './solver.js';
import { cli } from './utilities/command-line.utility.js';
import { is_secondary_module } from './utilities/modules.utility.js';
import { LF } from './constants/ascii.constant.js';
import { _KiB } from './constants/information.constant.js';

if (is_secondary_module(import.meta)) {
  throw new Error('Expected to run as entry point');
}

(async function main() {
  const args = cli.read([
    {
      name: 'measurements-path',
      type: 'fs-path',
      required: true,
    },
    {
      name: 'worker-count',
      type: 'integer',
      default: os.cpus().length,
    },
    {
      name: 'chunk-size',
      type: 'integer',
      default: 64 * _KiB,
    }
  ]);

  const beg = performance.now();
  await solve({
    input_path: args['measurements-path'],
    worker_count: args['worker-count'],
  });
  const end = performance.now();
  const elapsed = ((end - beg) / 1000).toFixed(4);
  console.log(
    `${LF + LF}Took ${elapsed} seconds to process ${args['measurements-path']}`,
  );
})();
