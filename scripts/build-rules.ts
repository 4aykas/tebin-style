import { writeRulesDigest } from '../src/rules-build.js';

const md = writeRulesDigest();
console.log(`wrote rules/dist/rules.md (${md.split('\n').length} lines)`);
