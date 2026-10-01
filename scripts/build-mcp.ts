import { writeMcpBundle } from '../src/mcp-bundle.js';

const js = await writeMcpBundle();
console.log(`wrote mcp/dist/server.mjs (${Math.round(js.length / 1024)} KB)`);
