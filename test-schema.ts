// Test script to debug the _zod error
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { apis } from "ws-dottie/apis";
import { transformDateSchemaToString } from "./src/tools/schemaUtils.js";

const wsfFares = (apis as Record<string, any>)["wsfFares"];
const cacheFlushGroup = wsfFares?.endpointGroups?.find(
  (g: any) => g.name === "cache-flush-date-fares"
);
const endpoint = cacheFlushGroup?.endpoints?.[0];

console.error("Endpoint:", endpoint.functionName);
console.error("Input schema type:", endpoint.inputSchema?._zod?.def?.type);
console.error("Output schema type:", endpoint.outputSchema?._zod?.def?.type);

const inputSchema = endpoint.inputSchema;
const outputSchema = transformDateSchemaToString(endpoint.outputSchema);

console.error("Transformed output schema type:", outputSchema?._zod?.def?.type);

const server = new McpServer({
  name: "test",
  version: "1.0.0",
});

console.error("Registering tool...");

server.registerTool(
  "get_cache_flush_date_fares",
  {
    title: "Get Cache Flush Date Fares",
    description: "Test tool",
    inputSchema,
    outputSchema,
  },
  async () => {
    return {
      content: [{ type: "text" as const, text: "test" }],
      structuredContent: { value: new Date().toISOString() },
    };
  }
);

console.error("Tool registered successfully!");

// Now try to connect and list tools
const transport = new StdioServerTransport();
console.error("Starting server...");

server
  .connect(transport)
  .then(() => {
    console.error("Server connected!");
  })
  .catch((e) => {
    console.error("Server failed:", e);
  });
