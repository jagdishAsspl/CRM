const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Change provider to mysql
content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "mysql"');

// 2. Remove postgresqlExtensions preview feature
content = content.replace(/previewFeatures\s*=\s*\["postgresqlExtensions"\]/g, '');

// 3. Remove extensions block
content = content.replace(/extensions\s*=\s*\[pgvector\(map:\s*"vector"\)\]/g, '');

// 4. Remove @db.Uuid
content = content.replace(/ @db\.Uuid/g, '');

// 5. Replace @db.JsonB with @db.Json
content = content.replace(/@db\.JsonB/g, '@db.Json');

// 6. Replace Unsupported("vector(1536)") with Json?
content = content.replace(/Unsupported\("vector\(1536\)"\)/g, 'Json?');

// 7. Replace Unsupported("tsvector")? with String?
content = content.replace(/Unsupported\("tsvector"\)\?/g, 'String?');

// 8. Replace scalar arrays String[] with Json?
content = content.replace(/\bfields\s+String\[\]/g, 'fields      Json?');
content = content.replace(/\btags\s+String\[\]/g, 'tags        Json?');
content = content.replace(/\bnotes\s+String\[\]/g, 'notes       Json?');
content = content.replace(/\bsharedWith\s+String\[\]/g, 'sharedWith  Json?');
content = content.replace(/\bconnected_documents\s+String\[\]/g, 'connected_documents Json?');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Successfully updated schema.prisma for MySQL');
