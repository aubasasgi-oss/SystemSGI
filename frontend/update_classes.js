const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('className="input-field"')) {
    c = c.replace(/className="input-field"/g, 'className="form-control"');
    fs.writeFileSync(p, c);
    console.log('Updated', p);
  }
});
