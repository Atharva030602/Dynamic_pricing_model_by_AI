import { hostOf } from './_lib/http.mjs'
// robots.txt with a licence pointer (RSL-style), so crawlers that skip MCP still see the terms.
export default function handler(req, res) {
  const host = hostOf(req)
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.status(200).send(`# Twofold: every piece has separate terms for people and AI systems.
# Machine-readable licences: ${host}/api/licence
# AI agents: use the MCP server at ${host}/api/mcp to preview, buy and retrieve.
License: ${host}/api/licence

User-agent: *
Allow: /
Disallow: /api/works

# Search indexing is free. AI training requires a licence (see uses.ai_train in each licence).
`)
}
