const fs = require('fs');
const path = require('path');

const files = [
  'actions/crm/accounts/search-accounts.ts',
  'actions/emails/messages.ts',
  'actions/user/search-users.ts',
  'lib/mcp/helpers.ts',
  'lib/mcp/tools/crm-users.ts'
];

for (const f of files) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/\s+as const\b/g, '');
    fs.writeFileSync(p, content, 'utf8');
    console.log('Cleaned as const in', f);
  }
}
