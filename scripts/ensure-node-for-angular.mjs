/**
 * Angular 20 CLI requires Node >= 20.19 or >= 22.12 (see `ng version` / release notes).
 */
const raw = process.version.replace(/^v/, '');
const parts = raw.split('.').map((s) => parseInt(s, 10) || 0);
const [major, minor = 0, patch = 0] = parts;

function supported() {
  if (major > 22) return true;
  if (major === 22) return minor > 12 || (minor === 12 && patch >= 0);
  if (major === 20) return minor > 19 || (minor === 19 && patch >= 0);
  return false;
}

if (!supported()) {
  console.error(
    `Node ${raw} is too old for Angular 20. Use Node >= 20.19 or >= 22.12.\n` +
      'From this repo: nvm use   (see .nvmrc)\n' +
      'Then: npm start',
  );
  process.exit(1);
}
