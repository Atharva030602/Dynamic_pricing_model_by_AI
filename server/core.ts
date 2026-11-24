// Server-side core: the same engine the browser uses, bundled for serverless functions.
export { handleMcp, TOOLS, PROTOCOL_VERSION, DEMO_AGENTS } from '../src/engine/mcp'
export { toMachineJson, summarise } from '../src/engine/licence'
export { SEED, SEED_SEALS } from '../src/data/works'
export { CREATORS } from '../src/data/seed'
export { valuate } from '../src/engine/valuation'
