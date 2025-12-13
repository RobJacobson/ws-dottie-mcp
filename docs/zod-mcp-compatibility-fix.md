# Zod 4 & MCP SDK Compatibility Fix

## Problem Statement

When calling MCP tools (e.g., `get_cache_flush_date_fares`), the server threw the following error:

```
Cannot read properties of undefined (reading '_zod')
```

This error occurred during tool execution, preventing tools from returning results to the MCP client (such as the MCP Inspector or Cursor).

## Investigation Summary

### Initial Symptoms

1. Tool registration appeared successful (63 tools registered)
2. `tools/list` requests worked initially
3. `tools/call` requests failed with the `_zod` error
4. Direct handler calls worked, but calls through MCP SDK request handlers failed

### Environment

- **ws-dottie-mcp**: MCP server wrapping Washington State Ferries APIs
- **ws-dottie**: Library providing API definitions with Zod schemas
- **Zod version**: 4.x (both packages)
- **MCP SDK version**: Latest with Zod 3/4 compatibility layer

## Root Cause Analysis

The error originated from a **bug in the MCP SDK's `validateToolOutput()` function** combined with **schema transformation issues** in `ws-dottie-mcp`.

### The MCP SDK Bug

In `@modelcontextprotocol/sdk/dist/esm/server/mcp.js` (lines 200-201):

```javascript
async validateToolOutput(tool, result, toolName) {
    // ... validation checks ...
    
    const outputObj = normalizeObjectSchema(tool.outputSchema);
    const parseResult = await safeParseAsync(outputObj, result.structuredContent);
    // ...
}
```

The problem: `normalizeObjectSchema()` returns `undefined` for non-object schemas (like `z.optional()` wrappers). When this happens, `safeParseAsync(undefined, ...)` is called.

Inside `safeParseAsync()` (from `zod-compat.js`):

```javascript
export function safeParseAsync(schema, data) {
    if (isZ4Schema(schema)) {  // <-- Called with undefined!
        // ...
    }
}

export function isZ4Schema(s) {
    const schema = s;
    return !!schema._zod;  // <-- TypeError: Cannot read properties of undefined (reading '_zod')
}
```

**The MCP SDK does not check if `outputObj` is undefined before passing it to `safeParseAsync()`.**

### The Schema Transformation Problem

The original `transformDateSchemaToString()` function in `ws-dottie-mcp` had multiple issues:

#### Issue 1: Non-Object Root Schemas

For a schema like `z.date().optional()`, the transformation returned:

```typescript
// Original transformation (BROKEN)
z.date().optional() → z.string().datetime().optional()
```

This is an `optional` wrapper, not an object. When MCP SDK called `normalizeObjectSchema()` on this, it returned `undefined`.

#### Issue 2: Instanceof Checks with Multiple Zod Instances

The original code used `instanceof` checks:

```typescript
// Original code (BROKEN)
if (schema instanceof z.ZodDate) { ... }
if (schema instanceof z.ZodOptional) { ... }
```

This failed because:
1. `ws-dottie` uses Zod extended with `zod-to-openapi`
2. `ws-dottie-mcp` imports its own Zod instance
3. `instanceof` checks fail across different module instances

#### Issue 3: Missing Support for Complex Types

The transformation didn't handle:
- Intersection types (`z.intersection()`, `z.and()`)
- Union types (`z.union()`, discriminated unions)
- Deeply nested Date fields in arrays of objects

## The Solution

### 1. Use Type Discriminators Instead of `instanceof`

Created helper functions that work with both Zod 3 and Zod 4:

```typescript
/**
 * Gets the schema type discriminator.
 * Works with both Zod 3 (_def.typeName) and Zod 4 (_zod.def.type).
 */
const getSchemaType = (schema: z.ZodTypeAny): string | undefined => {
  if (!schema) return undefined;

  // Zod 4: use _zod.def.type
  const z4Type = (schema as any)?._zod?.def?.type;
  if (z4Type) return z4Type;

  // Zod 3 fallback: use _def.typeName
  const z3TypeName = (schema as any)?._def?.typeName;
  if (z3TypeName) return z3TypeName;

  return undefined;
};

/**
 * Checks if a schema type matches expected type names.
 * Handles both Zod 3 (ZodDate) and Zod 4 (date) naming conventions.
 */
const isSchemaOfType = (
  schemaType: string | undefined,
  zod4Type: string,
  zod3Type: string
): boolean => {
  return schemaType === zod4Type || schemaType === zod3Type;
};
```

### 2. Always Return Object Schemas at Root Level

The MCP SDK requires root-level schemas to be objects. Updated transformations:

| Original Schema | Transformed Schema |
|----------------|-------------------|
| `z.date()` | `z.object({ value: z.string().datetime() })` |
| `z.date().optional()` | `z.object({ value: z.string().datetime().optional() })` |
| `z.date().nullable()` | `z.object({ value: z.string().datetime().nullable() })` |
| `z.array(T)` | `z.object({ items: z.array(transformedT) })` |
| `z.intersection(A, B)` | `z.object({ ...mergedShape })` |

Example transformation for optional dates:

```typescript
// Handle optional wrappers
if (isSchemaOfType(schemaType, "optional", "ZodOptional")) {
  const innerType = getInnerType(schema);
  if (!innerType) return schema;

  if (isRoot) {
    // For root optional schemas, wrap the value property as optional
    // This ensures the root schema is always an object (required by MCP SDK)
    const innerSchemaType = getSchemaType(innerType);
    if (isSchemaOfType(innerSchemaType, "date", "ZodDate")) {
      // z.date().optional() → z.object({ value: z.string().datetime().optional() })
      return z.object({ value: z.string().datetime().optional() });
    }
    // ... handle other types
  }

  // For non-root, preserve the optional wrapper
  const transformed = transformDateSchemaToString(innerType, false);
  return transformed.optional();
}
```

### 3. Add Support for Intersection and Union Types

Many ws-dottie schemas use intersection types for composing API responses:

```typescript
// Handle intersection types (z.intersection or z.and)
if (
  isSchemaOfType(schemaType, "intersection", "ZodIntersection") ||
  schemaType === "and"
) {
  const parts = getIntersectionParts(schema);
  if (!parts) return schema;

  const transformedLeft = transformDateSchemaToString(parts.left, false);
  const transformedRight = transformDateSchemaToString(parts.right, false);

  // Merge the shapes if both are objects
  const leftType = getSchemaType(transformedLeft);
  const rightType = getSchemaType(transformedRight);

  if (
    isSchemaOfType(leftType, "object", "ZodObject") &&
    isSchemaOfType(rightType, "object", "ZodObject")
  ) {
    const leftShape = getObjectShape(transformedLeft) ?? {};
    const rightShape = getObjectShape(transformedRight) ?? {};
    return z.object({ ...leftShape, ...rightShape });
  }

  // For non-object intersections, create a new intersection
  return z.intersection(transformedLeft, transformedRight);
}
```

### 4. Update Handler to Always Provide `structuredContent`

The MCP SDK throws an error if `outputSchema` is defined but `structuredContent` is missing:

```typescript
// ferryDataTools.ts handler updates
let structuredContent: Record<string, unknown>;

if (result === undefined || result === null) {
  // For optional schemas that return undefined, provide empty value
  structuredContent = { value: undefined };
} else if (result instanceof Date) {
  // Wrap Date results to match schema transformation
  structuredContent = { value: result.toISOString() };
} else if (Array.isArray(result)) {
  // Wrap arrays to match schema transformation
  const serializedItems = JSON.parse(
    JSON.stringify(result, (_key, value) =>
      value instanceof Date ? value.toISOString() : value
    )
  );
  structuredContent = { items: serializedItems };
} else if (result && typeof result === "object") {
  // Serialize dates within objects
  structuredContent = JSON.parse(
    JSON.stringify(result, (_key, value) =>
      value instanceof Date ? value.toISOString() : value
    )
  );
} else {
  // Wrap primitives
  structuredContent = { value: result };
}

return {
  content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  structuredContent,  // Always included
};
```

## Helper Functions Reference

### Zod Version-Agnostic Accessors

```typescript
// Get inner type from optional/nullable wrappers
const getInnerType = (schema: z.ZodTypeAny): z.ZodTypeAny | undefined => {
  if (!schema) return undefined;

  // Zod 4: prefer unwrap() method if available
  if (typeof (schema as any).unwrap === "function") {
    return (schema as any).unwrap();
  }

  // Zod 4: check _zod.def.innerType
  const z4Inner = (schema as any)?._zod?.def?.innerType;
  if (z4Inner) return z4Inner;

  // Zod 3 fallback
  return (schema as any)?._def?.innerType;
};

// Get shape from object schemas
const getObjectShape = (schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> | undefined => {
  if (!schema) return undefined;

  // Zod 4
  const z4Shape = (schema as any)?._zod?.def?.shape;
  if (z4Shape) {
    return typeof z4Shape === "function" ? z4Shape() : z4Shape;
  }

  // Zod 3 fallback
  const z3Shape = (schema as any)?._def?.shape;
  if (z3Shape) {
    return typeof z3Shape === "function" ? z3Shape() : z3Shape;
  }

  return undefined;
};

// Get element type from array schemas
const getArrayElement = (schema: z.ZodTypeAny): z.ZodTypeAny | undefined => {
  if (!schema) return undefined;

  const element = (schema as any)?.element;
  if (element) return element;

  const z4Element = (schema as any)?._zod?.def?.element;
  if (z4Element) return z4Element;

  return (schema as any)?._def?.type;
};

// Get intersection parts
const getIntersectionParts = (schema: z.ZodTypeAny): { left: z.ZodTypeAny; right: z.ZodTypeAny } | undefined => {
  if (!schema) return undefined;

  const z4Left = (schema as any)?._zod?.def?.left;
  const z4Right = (schema as any)?._zod?.def?.right;
  if (z4Left && z4Right) return { left: z4Left, right: z4Right };

  const z3Left = (schema as any)?._def?.left;
  const z3Right = (schema as any)?._def?.right;
  if (z3Left && z3Right) return { left: z3Left, right: z3Right };

  return undefined;
};

// Get union options
const getUnionOptions = (schema: z.ZodTypeAny): z.ZodTypeAny[] | undefined => {
  if (!schema) return undefined;

  const z4Options = (schema as any)?._zod?.def?.options;
  if (Array.isArray(z4Options)) return z4Options;

  const z3Options = (schema as any)?._def?.options;
  if (Array.isArray(z3Options)) return z3Options;

  return undefined;
};
```

## Zod 3 vs Zod 4 Internal API Differences

| Feature | Zod 3 | Zod 4 |
|---------|-------|-------|
| Type discriminator | `schema._def.typeName` (e.g., "ZodDate") | `schema._zod.def.type` (e.g., "date") |
| Inner type access | `schema._def.innerType` | `schema._zod.def.innerType` or `schema.unwrap()` |
| Object shape | `schema._def.shape` | `schema._zod.def.shape` |
| Array element | `schema._def.type` | `schema._zod.def.element` or `schema.element` |
| Schema marker | `schema._def` exists | `schema._zod` exists |

## Verification

After applying the fix:

```
=== Testing after fix ===

Testing tools/list...
✓ tools/list succeeded with 63 tools

Testing get_cache_flush_date_fares...
✓ Success!
  structuredContent: {"value":"2025-12-10T04:47:19.737Z"}
```

## Recommendations

### For MCP SDK Maintainers

Add a null check in `validateToolOutput()`:

```javascript
async validateToolOutput(tool, result, toolName) {
    // ... existing checks ...
    
    const outputObj = normalizeObjectSchema(tool.outputSchema);
    
    // Add this check
    if (!outputObj) {
        // Cannot validate non-object schemas, skip validation
        return;
    }
    
    const parseResult = await safeParseAsync(outputObj, result.structuredContent);
    // ...
}
```

### For MCP Tool Authors Using Zod 4

1. Always ensure root-level `outputSchema` is an object schema
2. Use type discriminators (`_zod.def.type`) instead of `instanceof` checks
3. Always provide `structuredContent` when `outputSchema` is defined
4. Transform `z.date()` to `z.string().datetime()` for JSON serialization

## Files Modified

1. `src/tools/schemaUtils.ts` - Complete refactoring with Zod 3/4 compatibility
2. `src/tools/ferryDataTools.ts` - Handler updates for consistent `structuredContent`

---

*Document created: December 11, 2025*
*Issue: Zod 4 MCP SDK compatibility with ws-dottie schemas*
