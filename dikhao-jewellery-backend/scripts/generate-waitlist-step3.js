require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { runVirtualTryOn } = require('../services/vertexTryOn');

const WAITLIST = path.resolve(__dirname, '../../dikhao-jewellery-waitlist/public/how-it-works');

async function main() {
  const person = fs.readFileSync(path.join(WAITLIST, 'step1.jpg'));
  const garment = fs.readFileSync(path.join(WAITLIST, 'step2.jpg'));

  console.log('Running Vertex VTON — step1 (person) + step2 (necklace)...');
  const out = await runVirtualTryOn(person, garment);

  const dest = path.join(WAITLIST, 'step3.jpg');
  fs.writeFileSync(dest, out);
  console.log(`Wrote ${dest} (${out.length} bytes)`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
