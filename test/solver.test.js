import assert from 'node:assert';
import events from 'node:events';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { after, before, describe } from 'node:test';
import url from 'node:url';
import { _Byte, _KiB, _MiB } from '../src/constants/information.constant.js';
import { solve } from '../src/solver.js';

describe('solver', () => {
  const filename = url.fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  const measurements_path = path.resolve(dirname, 'fixtures', 'measurements');

  function input_path_of(name) {
    const input_path = path.resolve(measurements_path, `${name}.txt`);
    return input_path;
  }

  async function output_of(name) {
    const output_path = path.resolve(measurements_path, `${name}.out`);
    const output = await fsp.readFile(output_path, {
      encoding: 'utf-8',
      flag: 'r',
    });
    return output;
  }

  const computed_path = `.test_computed_${Date.now()}`;
  before(async () => {
    await fsp.mkdir(computed_path);
  });

  after(async () => {
    await fsp.rm(computed_path, {
      force: true,
      recursive: true,
      maxRetries: 4,
      retryDelay: 1024,
    });
  });

  async function create_writable(name) {
    const file_path = path.resolve(computed_path, `${name}.out`);
    const write_stream = fs.createWriteStream(file_path, { encoding: 'utf-8' });
    await events.once(write_stream, 'open');
    return write_stream;
  }

  async function close_writable(stream) {
    stream.close();
    const payload = await events.once(stream, 'close');
    return payload;
  }

  async function read_computed_of(name) {
    const file_path = path.resolve(computed_path, `${name}.out`);
    const computed = await fsp.readFile(file_path, { encoding: 'utf-8' });
    return computed;
  }

  const worker_counts = [1, 4, 12];

  const input_name = [
    '1',
    '10',
    '10000-unique-keys',
    '2',
    '20',
    '3',
    'boundaries',
    'complex-utf8',
    'dot',
    'rounding',
    'short',
    'shortest',
  ];

  const chunk_sizes = [512 * _Byte, 32 * _KiB, 1 * _MiB];

  const test_cases = worker_counts
    .flatMap((worker_count) =>
      input_name.map((input_name) => ({ worker_count, input_name })),
    )
    .flatMap((conf) =>
      chunk_sizes.map((chunk_size) => ({ ...conf, chunk_size })),
    );

  for (const { worker_count, input_name, chunk_size } of test_cases) {
    const test_name = `solve({ input_name: ${input_name}, worker_count: ${worker_count}, chunk_size: ${chunk_size} })`;
    describe(test_name, async () => {
      const input_path = input_path_of(input_name);
      const output_stream = await create_writable(input_name);
      await solve({
        input_path,
        worker_count,
        chunk_size,
        output_stream,
      });
      await close_writable(output_stream);
      const computed = await read_computed_of(input_name);
      const expected = await output_of(input_name);
      assert.equal(computed, expected);
    });
  }
});
