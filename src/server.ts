import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerFerryDocsTools } from "@/tools/docs/registerFerryDocsTools.js";
import { registerFerryDataTools } from "@/tools/ferryDataTools.js";

const main = async (): Promise<void> => {
  const server = new McpServer({ name: "ws-dottie-mcp", version: "0.1.0" });

  registerFerryDataTools(server);
  registerFerryDocsTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error("ws-dottie-mcp server failed:", error);
  process.exit(1);
});
