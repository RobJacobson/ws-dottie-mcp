# MCP SDK Pull Request Draft

**Repository:** https://github.com/modelcontextprotocol/typescript-sdk

**Related Issues:**
- #1149 - "output schema has unnecessary restriction type=object"
- #1277 - "zod-compat fails to detect standard Zod v4 schemas"
- #594 - "OutputSchema in RegisterTool can only take non-nullable schema"

---

## PR Title

`fix(server): Handle non-object output schemas in validateToolOutput`

---

## PR Description

### Summary

Fixes a crash in `validateToolOutput()` when a tool's `outputSchema` is not an object schema (e.g., `z.optional()`, `z.array()`, or other non-object Zod types at the root level).

**Closes #1149** (partially - this PR handles the runtime crash; full support for non-object schemas may require additional changes)

### Problem

When a tool has an `outputSchema` that is not directly an object schema, `normalizeObjectSchema()` returns `undefined`. This `undefined` value is then passed to `safeParseAsync()`, which calls `isZ4Schema(undefined)`, resulting in:

```
TypeError: Cannot read properties of undefined (reading '_zod')
```

**Reproduction steps:**
1. Register a tool with `outputSchema: z.date().optional()` (or any non-object root schema)
2. Call the tool
3. Crash occurs during output validation

### Root Cause

In `src/server/mcp.ts`, the `validateToolOutput` method:

```typescript
const outputObj = normalizeObjectSchema(tool.outputSchema);
const parseResult = await safeParseAsync(outputObj, result.structuredContent);
```

`normalizeObjectSchema()` only returns a schema for object types. For arrays, optionals, or other types, it returns `undefined`. This `undefined` is passed directly to `safeParseAsync()`.

### Solution

Add a null check after `normalizeObjectSchema()`:

```typescript
const outputObj = normalizeObjectSchema(tool.outputSchema);

// Cannot validate non-object schemas (arrays, optionals at root level, etc.)
if (!outputObj) {
    return;
}

const parseResult = await safeParseAsync(outputObj, result.structuredContent);
```

### Why This Approach

1. **Graceful degradation**: Tools with non-object output schemas still work; validation is simply skipped
2. **No breaking changes**: Existing tools with object schemas continue to be validated
3. **Explicit intent**: Clear comment explains why validation is skipped
4. **Minimal change**: 4 lines added, no architectural changes

### Alternative Considered

Making `isZ4Schema()` null-safe:
```typescript
export function isZ4Schema(s: unknown): boolean {
    if (!s || typeof s !== 'object') return false;
    return !!(s as any)._zod;
}
```

This was rejected because it would mask potential bugs where `undefined` is incorrectly passed to schema-handling functions.

### Testing

- [ ] Add test case: tool with `z.array()` outputSchema
- [ ] Add test case: tool with `z.optional()` outputSchema  
- [ ] Verify existing tests pass
- [ ] Manual testing with MCP Inspector

### Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated if needed
- [ ] Changelog entry added

---

## Code Change

**File:** `src/server/mcp.ts`

**Method:** `validateToolOutput`

```diff
  async validateToolOutput(tool: RegisteredTool, result: unknown, toolName: string): Promise<void> {
      if (!tool.outputSchema) {
          return;
      }
      // Only validate CallToolResult, not CreateTaskResult
      if (!('content' in result)) {
          return;
      }
      if (result.isError) {
          return;
      }
      if (!result.structuredContent) {
          throw new McpError(ErrorCode.InvalidParams, `Output validation error: Tool ${toolName} has an output schema but no structured content was provided`);
      }
      // if the tool has an output schema, validate structured content
      const outputObj = normalizeObjectSchema(tool.outputSchema);
+
+     // Cannot validate non-object schemas (arrays, optionals at root level, etc.)
+     // normalizeObjectSchema returns undefined for these types
+     if (!outputObj) {
+         return;
+     }
+
      const parseResult = await safeParseAsync(outputObj, result.structuredContent);
      if (!parseResult.success) {
          const error = 'error' in parseResult ? parseResult.error : 'Unknown error';
          const errorMessage = getParseErrorMessage(error);
          throw new McpError(ErrorCode.InvalidParams, `Output validation error: Invalid structured content for tool ${toolName}: ${errorMessage}`);
      }
  }
```

---

## Issue Template (if filing issue first)

### Bug Report Title

`validateToolOutput crashes with non-object output schemas`

### Description

When a tool's `outputSchema` is not an object schema (e.g., `z.date().optional()`, `z.array(z.string())`), calling the tool crashes with:

```
TypeError: Cannot read properties of undefined (reading '_zod')
```

### Steps to Reproduce

1. Create MCP server
2. Register tool with non-object outputSchema:
   ```typescript
   server.registerTool("my_tool", {
       outputSchema: z.date().optional(),
   }, async () => {
       return { content: [{ type: "text", text: "result" }], structuredContent: { value: new Date().toISOString() } };
   });
   ```
3. Call the tool via MCP client
4. Server crashes

### Expected Behavior

Tool should execute successfully. If validation cannot be performed for non-object schemas, it should be skipped gracefully.

### Actual Behavior

Server throws `TypeError: Cannot read properties of undefined (reading '_zod')`

### Environment

- SDK Version: 1.24.3
- Zod Version: 4.x
- Node Version: 24.x
- OS: macOS

### Stack Trace

```
TypeError: Cannot read properties of undefined (reading '_zod')
    at isZ4Schema (zod-compat.ts:61:21)
    at safeParseAsync (zod-compat.ts:97:9)
    at McpServer.validateToolOutput (mcp.ts:201:...)
```

---

## Next Steps

1. **Option A - File issue first:** Create issue using template above, then reference it in PR
2. **Option B - Direct PR:** Fork repo, make change, submit PR with description above

### Fork Commands

```bash
# Clone the SDK repo
git clone https://github.com/modelcontextprotocol/typescript-sdk.git
cd typescript-sdk

# Create feature branch
git checkout -b fix/validate-tool-output-null-check

# Make the change to src/server/mcp.ts
# ... edit file ...

# Build and test
npm install
npm run build
npm test

# Commit and push
git add src/server/mcp.ts
git commit -m "fix(server): Handle non-object output schemas in validateToolOutput"
git push origin fix/validate-tool-output-null-check

# Create PR via GitHub UI
```
