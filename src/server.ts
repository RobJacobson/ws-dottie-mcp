import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFerryDocsTools } from "./tools/docs/registerFerryDocsTools.js";
import { registerFerriesTools } from "./tools/ferries.js";

const server = new McpServer({
  name: "ws-dottie-mcp",
  version: "0.1.0",
});

registerFerriesTools(server);
registerFerryDocsTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP server running on stdio");
