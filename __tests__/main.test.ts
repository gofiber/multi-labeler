import fs from 'fs';
import { parse } from '../src/config';

it('.github/labeler.selftest.yml', function () {
  const content = fs.readFileSync(`.github/labeler.selftest.yml`, 'utf8');
  expect(() => parse(content)).not.toThrowError();
});
