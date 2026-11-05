import {build} from 'esbuild';

await build({
  entryPoints:['scripts/mcp-sdk-entry.mjs'],
  outfile:'dist/runtime/mcp-sdk.mjs',
  bundle:true,
  format:'esm',
  platform:'node',
  target:'node22',
  // The release must run without node_modules on the server.
  packages:'bundle',
  logLevel:'warning',
});
