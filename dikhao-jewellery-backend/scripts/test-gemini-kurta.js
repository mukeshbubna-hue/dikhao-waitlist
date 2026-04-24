#!/usr/bin/env node
// Quick probe: can Gemini 2.5 Flash Image dress a test bust photo in a kurta?
require('dotenv').config();
const fs = require('fs');
const { dressInKurta } = require('../services/imageEdit');

const IN  = '/Users/mukeshbubna/my-weekender-project/my-weekender-project/dikhao-store-backend/test-assets/person.jpg';
const OUT = '/tmp/kurta-test.png';

async function main() {
  const t0 = Date.now();
  const buf = fs.readFileSync(IN);
  console.log(`Input: ${IN} (${buf.length} bytes)`);

  const result = await dressInKurta(buf, 'image/jpeg');
  const ms = Date.now() - t0;

  fs.writeFileSync(OUT, result);
  console.log(`✓ Output written to ${OUT} (${result.length} bytes) in ${ms}ms`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  if (err.response?.data) {
    console.error('Response:', JSON.stringify(err.response.data, null, 2).slice(0, 1000));
  }
  process.exit(1);
});
