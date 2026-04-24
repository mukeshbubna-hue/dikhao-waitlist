require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { removeBackground } = require('../services/backgroundRemoval');
const { runVirtualTryOn } = require('../services/vertexTryOn');

const IN  = path.join(__dirname, '../test-assets');
const OUT = path.join(__dirname, '../test-output');

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

  console.log('Reading test images...');
  const person = fs.readFileSync(path.join(IN, 'person.jpg'));
  const shirt  = fs.readFileSync(path.join(IN, 'shirt.jpg'));

  console.log('Removing backgrounds (PhotoRoom)...');
  const cleanPerson = await removeBackground(person, 'grey');
  const cleanShirt  = await removeBackground(shirt,  'white');
  fs.writeFileSync(path.join(OUT, 'clean-person.jpg'), cleanPerson);
  fs.writeFileSync(path.join(OUT, 'clean-shirt.jpg'),  cleanShirt);
  console.log('  → test-output/clean-person.jpg + clean-shirt.jpg');

  console.log('Running Vertex Virtual Try-On...');
  const result = await runVirtualTryOn(cleanPerson, cleanShirt);
  fs.writeFileSync(path.join(OUT, 'result.jpg'), result);
  console.log('  → test-output/result.jpg');

  console.log('Done ✓');
}

main().catch(err => {
  console.error('TEST FAILED:', err.message);
  process.exit(1);
});
