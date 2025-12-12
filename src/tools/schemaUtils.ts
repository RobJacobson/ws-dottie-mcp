/**
 * Schema transformation utilities for MCP compatibility.
 *
 * Provides functions to transform Zod schemas to ensure compatibility with
 * Model Context Protocol (MCP) requirements, particularly around JSON serialization
 * and structured content validation.
 *
 * This module is compatible with both Zod 3 and Zod 4, using type discriminators
 * instead of instanceof checks to handle schemas from different Zod instances.
 */

import { z } from "zod";

/**
 * Gets the schema type discriminator.
 * Works with both Zod 3 (_def.typeName) and Zod 4 (_zod.def.type).
 *
 * @param schema - The Zod schema to inspect
 * @returns The type discriminator string, or undefined if not found
 */
const getSchemaType = (schema: z.ZodTypeAny): string | undefined => {
  if (!schema) return undefined;

  // Zod 4: use _zod.def.type
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Type = (schema as any)?._zod?.def?.type;
  if (z4Type) return z4Type;

  // Zod 3 fallback: use _def.typeName
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z3TypeName = (schema as any)?._def?.typeName;
  if (z3TypeName) return z3TypeName;

  return undefined;
};

/**
 * Gets the inner type from wrapper schemas (optional, nullable, default, etc.).
 * Works with both Zod 3 and Zod 4.
 *
 * @param schema - The wrapper schema
 * @returns The inner type, or undefined if not found
 */
const getInnerType = (schema: z.ZodTypeAny): z.ZodTypeAny | undefined => {
  if (!schema) return undefined;

  // Zod 4: prefer unwrap() method if available
  // biome-ignore lint/suspicious/noExplicitAny: Checking for optional method
  if (typeof (schema as any).unwrap === "function") {
    // biome-ignore lint/suspicious/noExplicitAny: Using optional method
    return (schema as any).unwrap();
  }

  // Zod 4: check _zod.def.innerType
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Inner = (schema as any)?._zod?.def?.innerType;
  if (z4Inner) return z4Inner;

  // Zod 3 fallback: _def.innerType
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  return (schema as any)?._def?.innerType;
};

/**
 * Gets the shape from object schemas.
 * Works with both Zod 3 and Zod 4.
 *
 * @param schema - The object schema
 * @returns The shape record, or undefined if not found
 */
const getObjectShape = (
  schema: z.ZodTypeAny
): Record<string, z.ZodTypeAny> | undefined => {
  if (!schema) return undefined;

  // Zod 4: _zod.def.shape (may be a function or object)
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Shape = (schema as any)?._zod?.def?.shape;
  if (z4Shape) {
    return typeof z4Shape === "function" ? z4Shape() : z4Shape;
  }

  // Zod 3 fallback: _def.shape (may be a function or object)
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z3Shape = (schema as any)?._def?.shape;
  if (z3Shape) {
    return typeof z3Shape === "function" ? z3Shape() : z3Shape;
  }

  // Also check for direct shape property (some Zod versions)
  // biome-ignore lint/suspicious/noExplicitAny: Checking for optional property
  const directShape = (schema as any)?.shape;
  if (directShape) {
    return typeof directShape === "function" ? directShape() : directShape;
  }

  return undefined;
};

/**
 * Gets the element type from array schemas.
 * Works with both Zod 3 and Zod 4.
 *
 * @param schema - The array schema
 * @returns The element type, or undefined if not found
 */
const getArrayElement = (schema: z.ZodTypeAny): z.ZodTypeAny | undefined => {
  if (!schema) return undefined;

  // Zod 4: check element property first, then _zod.def.element
  // biome-ignore lint/suspicious/noExplicitAny: Checking for optional property
  const element = (schema as any)?.element;
  if (element) return element;

  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Element = (schema as any)?._zod?.def?.element;
  if (z4Element) return z4Element;

  // Zod 3 fallback: _def.type (confusingly named)
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  return (schema as any)?._def?.type;
};

/**
 * Gets left and right schemas from intersection types.
 * Works with both Zod 3 and Zod 4.
 *
 * @param schema - The intersection schema
 * @returns Object with left and right schemas, or undefined if not found
 */
const getIntersectionParts = (
  schema: z.ZodTypeAny
): { left: z.ZodTypeAny; right: z.ZodTypeAny } | undefined => {
  if (!schema) return undefined;

  // Zod 4: _zod.def.left and _zod.def.right
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Left = (schema as any)?._zod?.def?.left;
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Right = (schema as any)?._zod?.def?.right;
  if (z4Left && z4Right) return { left: z4Left, right: z4Right };

  // Zod 3 fallback
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z3Left = (schema as any)?._def?.left;
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z3Right = (schema as any)?._def?.right;
  if (z3Left && z3Right) return { left: z3Left, right: z3Right };

  return undefined;
};

/**
 * Gets options array from union types.
 * Works with both Zod 3 and Zod 4.
 *
 * @param schema - The union schema
 * @returns Array of option schemas, or undefined if not found
 */
const getUnionOptions = (schema: z.ZodTypeAny): z.ZodTypeAny[] | undefined => {
  if (!schema) return undefined;

  // Zod 4: _zod.def.options
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z4Options = (schema as any)?._zod?.def?.options;
  if (Array.isArray(z4Options)) return z4Options;

  // Zod 3 fallback
  // biome-ignore lint/suspicious/noExplicitAny: Accessing internal Zod properties
  const z3Options = (schema as any)?._def?.options;
  if (Array.isArray(z3Options)) return z3Options;

  return undefined;
};

/**
 * Checks if a schema type matches any of the expected type names.
 * Handles both Zod 3 (ZodDate, ZodOptional) and Zod 4 (date, optional) naming.
 *
 * @param schemaType - The type string from getSchemaType
 * @param zod4Type - The Zod 4 type name (e.g., "date")
 * @param zod3Type - The Zod 3 type name (e.g., "ZodDate")
 */
const isSchemaOfType = (
  schemaType: string | undefined,
  zod4Type: string,
  zod3Type: string
): boolean => {
  return schemaType === zod4Type || schemaType === zod3Type;
};

/**
 * Transforms a Zod schema to replace Date types with string types for JSON serialization.
 *
 * MCP requires that all structured content be JSON-serializable, but Zod schemas often
 * use `z.date()` which represents Date objects. This function recursively transforms
 * all Date types in a schema to string types with datetime validation.
 *
 * The transformation handles:
 * - Direct `z.date()` → `z.object({ value: z.string().datetime() })`
 * - Optional dates: `z.date().optional()` → `z.object({ value: z.string().datetime().optional() })`
 * - Nullable dates: `z.date().nullable()` → `z.object({ value: z.string().datetime().nullable() })`
 * - Nested dates in objects and arrays (recursive transformation)
 *
 * IMPORTANT: For root-level schemas, this function always returns an object schema.
 * This is required because MCP SDK's output validation calls `normalizeObjectSchema()`
 * followed by `safeParseAsync()`, and if the schema is not an object (e.g., optional wrapper),
 * `normalizeObjectSchema()` returns undefined, causing a crash in `safeParseAsync()`.
 *
 * This function is compatible with both Zod 3 and Zod 4, using type discriminators
 * instead of instanceof checks to work correctly with schemas from different Zod instances.
 *
 * @param schema - The Zod schema to transform
 * @param isRoot - Whether this is the root-level schema (affects wrapping behavior)
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
  schema: z.ZodTypeAny,
  isRoot = true
): z.ZodTypeAny => {
  // Safety check for undefined/null schemas
  if (!schema) {
    return schema;
  }

  const schemaType = getSchemaType(schema);

  // Handle date schemas
  if (isSchemaOfType(schemaType, "date", "ZodDate")) {
    // Always wrap in object for root schemas
    return z.object({ value: z.string().datetime() });
  }

  // Handle optional wrappers
  if (isSchemaOfType(schemaType, "optional", "ZodOptional")) {
    const innerType = getInnerType(schema);
    if (!innerType) return schema;

    if (isRoot) {
      // For root optional schemas, transform the inner type and wrap the value property as optional
      // This ensures the root schema is always an object (required by MCP SDK validation)
      const innerSchemaType = getSchemaType(innerType);
      if (isSchemaOfType(innerSchemaType, "date", "ZodDate")) {
        // z.date().optional() → z.object({ value: z.string().datetime().optional() })
        return z.object({ value: z.string().datetime().optional() });
      }
      // For other types, transform recursively but ensure it's an object
      const transformed = transformDateSchemaToString(innerType, false);
      // If the transformed inner is already an object, make its properties optional
      const transformedType = getSchemaType(transformed);
      if (isSchemaOfType(transformedType, "object", "ZodObject")) {
        return transformed; // Keep as object, the value inside may be optional
      }
      // Otherwise wrap in object with optional value
      return z.object({ value: transformed.optional() });
    }

    // For non-root, preserve the optional wrapper
    const transformed = transformDateSchemaToString(innerType, false);
    return transformed.optional();
  }

  // Handle nullable wrappers
  if (isSchemaOfType(schemaType, "nullable", "ZodNullable")) {
    const innerType = getInnerType(schema);
    if (!innerType) return schema;

    if (isRoot) {
      // For root nullable schemas, transform the inner type and wrap the value property as nullable
      const innerSchemaType = getSchemaType(innerType);
      if (isSchemaOfType(innerSchemaType, "date", "ZodDate")) {
        // z.date().nullable() → z.object({ value: z.string().datetime().nullable() })
        return z.object({ value: z.string().datetime().nullable() });
      }
      const transformed = transformDateSchemaToString(innerType, false);
      const transformedType = getSchemaType(transformed);
      if (isSchemaOfType(transformedType, "object", "ZodObject")) {
        return transformed;
      }
      return z.object({ value: transformed.nullable() });
    }

    // For non-root, preserve the nullable wrapper
    const transformed = transformDateSchemaToString(innerType, false);
    return transformed.nullable();
  }

  // Handle object schemas
  if (isSchemaOfType(schemaType, "object", "ZodObject")) {
    const shape = getObjectShape(schema);
    if (!shape) return schema;

    const transformedShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(shape)) {
      transformedShape[key] = transformDateSchemaToString(
        value as z.ZodTypeAny,
        false
      );
    }
    return z.object(transformedShape);
  }

  // Handle array schemas
  if (isSchemaOfType(schemaType, "array", "ZodArray")) {
    const elementType = getArrayElement(schema);
    if (!elementType) return schema;
    const transformedElement = transformDateSchemaToString(elementType, false);

    if (isRoot) {
      // For root arrays, wrap in object to ensure MCP SDK can process it
      return z.object({ items: z.array(transformedElement) });
    }
    return z.array(transformedElement);
  }

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
      const mergedSchema = z.object({ ...leftShape, ...rightShape });

      if (isRoot) {
        return mergedSchema;
      }
      return mergedSchema;
    }

    // For non-object intersections, create a new intersection
    // biome-ignore lint/suspicious/noExplicitAny: Using z.intersection with transformed schemas
    const intersected = (z as any).intersection(
      transformedLeft,
      transformedRight
    );

    if (isRoot) {
      // Wrap in object for root
      return z.object({ value: intersected });
    }
    return intersected;
  }

  // Handle union types (z.union or z.or)
  if (
    isSchemaOfType(schemaType, "union", "ZodUnion") ||
    isSchemaOfType(schemaType, "discriminatedUnion", "ZodDiscriminatedUnion")
  ) {
    const options = getUnionOptions(schema);
    if (!options || options.length === 0) return schema;

    const transformedOptions = options.map((opt) =>
      transformDateSchemaToString(opt, false)
    );

    // biome-ignore lint/suspicious/noExplicitAny: Using z.union with transformed options
    const unionSchema = (z as any).union(transformedOptions);

    if (isRoot) {
      // For root unions, wrap in object
      return z.object({ value: unionSchema });
    }
    return unionSchema;
  }

  // For all other schema types at root level, wrap in object
  if (isRoot) {
    return z.object({ value: schema });
  }

  // For non-root, return unchanged
  return schema;
};
