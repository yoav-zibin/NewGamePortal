const fs = require('fs');
const revision = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim();
const output = {releaseVersion: revision};
fs.writeFileSync('src/sentry-config.json', JSON.stringify(output,null,4));
console.log('src/sentry-config.json saved!');
