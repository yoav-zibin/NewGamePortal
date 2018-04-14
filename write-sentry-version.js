const fs = require('fs');
const revision = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim();
fs.writeFile('src/sentry-config.txt', `{"releaseVersion": "${revision}"}`, (err) => {  
  if (err) throw err;
  // success case, the file was saved
  console.log('src/sentry-config.txt saved!');
});