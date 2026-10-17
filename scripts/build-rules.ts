import { writeRulesDigest } from '../src/rules-build.js';
import { writeLlmsFull } from '../src/llms-full.js';

const md = writeRulesDigest();
console.log(`wrote rules/dist/rules.md (${md.split('\n').length} lines)`);

// After the rules digest, and after build-assets wrote every DESIGN.md.
const full = writeLlmsFull();
console.log(`wrote llms-full.txt (${full.split('\n').length} lines)`);
