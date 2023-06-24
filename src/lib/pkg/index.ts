import fs from 'fs';

// Read package.json
const packageJson = fs.readFileSync('./package.json', 'utf8');

// Parse package.json
const { type: moduleType } = JSON.parse(packageJson);
console.log(moduleType);
export default moduleType;