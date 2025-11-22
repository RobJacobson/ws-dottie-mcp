import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerVesselsTools } from "./apis/index.js";
import { registerDocsTools } from "./utils/registerDocsTools.js";

const server = new McpServer({
  name: "ws-dottie-mcp",
  version: "0.1.0",
});

registerVesselsTools(server);
registerDocsTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP server running on stdio");
