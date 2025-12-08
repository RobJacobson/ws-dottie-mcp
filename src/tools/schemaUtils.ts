/**
 * Schema transformation utilities for MCP compatibility.
 *
 * Provides functions to transform Zod schemas to ensure compatibility with
 * Model Context Protocol (MCP) requirements, particularly around JSON serialization
 * and structured content validation.
 */

import { z } from "zod";

/**
 * Transforms a Zod schema to replace Date types with string types for JSON serialization.
 *
 * MCP requires that all structured content be JSON-serializable, but Zod schemas often
 * use `z.date()` which represents Date objects. This function recursively transforms
 * all Date types in a schema to string types with datetime validation.
 *
 * The transformation handles:
 * - Direct `z.date()` → `z.string().datetime()`
 * - Optional dates: `z.date().optional()` → `z.string().datetime().optional()`
 * - Nullable dates: `z.date().nullable()` → `z.string().datetime().nullable()`
 * - Nested dates in objects and arrays (recursive transformation)
 *
 * @param schema - The Zod schema to transform
 * @returns A new schema with all Date types replaced by datetime string types
 *
 * @example
 * ```typescript
 * const originalSchema = z.object({
 *   createdAt: z.date(),
 *   updatedAt: z.date().optional(),
 *   metadata: z.object({
 *     lastModified: z.date()
 *   })
 * });
 *
 * const transformedSchema = transformDateSchemaToString(originalSchema);
 * // Now accepts ISO datetime strings instead of Date objects
 * ```
 */
export const transformDateSchemaToString = (
  schema: z.ZodTypeAny
): z.ZodTypeAny => {
  const typeName = schema._def.typeName;

  // Handle z.date() -> z.string().datetime() for nested dates
  // Top-level dates are handled separately in the handler
  if (typeName === "ZodDate") {
    return z.string().datetime();
  }

  // Handle z.date().optional() -> unwrap and transform inner type
  if (typeName === "ZodOptional") {
    const innerType = schema._def.innerType;
    const transformed = transformDateSchemaToString(innerType);
    return transformed.optional();
  }

  // Handle z.date().nullable() -> unwrap and transform inner type
  if (typeName === "ZodNullable") {
    const innerType = schema._def.innerType;
    const transformed = transformDateSchemaToString(innerType);
    return transformed.nullable();
  }

  // Handle ZodObject - recursively transform shape
  if (typeName === "ZodObject") {
    const shape = schema._def.shape();
    const transformedShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(shape)) {
      transformedShape[key] = transformDateSchemaToString(
        value as z.ZodTypeAny
      );
    }
    return z.object(transformedShape);
  }

  // Handle ZodArray - recursively transform element type
  if (typeName === "ZodArray") {
    const elementType = schema._def.type;
    const transformedElement = transformDateSchemaToString(elementType);
    return z.array(transformedElement);
  }

  // For other schema types, return as-is
  return schema;
};
