import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';
setFlagsFromString('--no-incremental-marking');
const {run} = await import('./solve.js');
const cases = JSON.parse(readFileSync(join(process.env.MAKEFUN_INPUT_DIR ?? '/input','cases.json'),'utf8'));
writeFileSync(join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output','answers.json'),JSON.stringify(cases.map(c=>run(c.input))));
