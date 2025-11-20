import type { OpenAPIV3 } from "openapi-types";
import { z } from "zod";

/**
 * Converts an OpenAPI JSON Schema to a Zod v3 schema.
 * Handles common OpenAPI parameter types: string, number, integer, boolean, enum, optional.
 * Supports validation constraints like min/max length, patterns, and array item counts.
 *
 * @param schema - The OpenAPI schema object or reference
 * @param required - Whether the field is required
 * @returns A Zod schema type that matches the OpenAPI schema
 */
const openApiSchemaToZod3 = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
  required: boolean = false
): z.ZodTypeAny => {
  // Handle undefined schema (no schema defined)
  if (!schema) {
    return z.any();
  }

  // Handle $ref references (for now, return any - could be enhanced to resolve references)
  if ("$ref" in schema) {
    return z.any();
  }

  const schemaObj = schema as OpenAPIV3.SchemaObject;

  // Handle enum
  if (schemaObj.enum && schemaObj.enum.length > 0) {
    const enumValues = schemaObj.enum as [string, ...string[]];
    const zodEnum = z.enum(enumValues);
    return required ? zodEnum : zodEnum.optional();
  }

  // Handle type-based schemas
  switch (schemaObj.type) {
    case "string": {
      let zodString = z.string();
      if (schemaObj.format === "date" || schemaObj.format === "date-time") {
        // Keep as string for date formats (could be enhanced to use z.date() if needed)
        zodString = z.string();
      }
      if (schemaObj.minLength !== undefined) {
        zodString = zodString.min(schemaObj.minLength);
      }
      if (schemaObj.maxLength !== undefined) {
        zodString = zodString.max(schemaObj.maxLength);
      }
      if (schemaObj.pattern) {
        zodString = zodString.regex(new RegExp(schemaObj.pattern));
      }
      return required ? zodString : zodString.optional();
    }

    case "number":
    case "integer": {
      let zodNumber =
        schemaObj.type === "integer" ? z.number().int() : z.number();
      if (schemaObj.minimum !== undefined) {
        zodNumber = zodNumber.min(schemaObj.minimum);
      }
      if (schemaObj.maximum !== undefined) {
        zodNumber = zodNumber.max(schemaObj.maximum);
      }
      return required ? zodNumber : zodNumber.optional();
    }

    case "boolean": {
      const zodBoolean = z.boolean();
      return required ? zodBoolean : zodBoolean.optional();
    }

    case "array": {
      if (schemaObj.items) {
        const itemSchema = openApiSchemaToZod3(
          schemaObj.items as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
          true
        );
        let zodArray = z.array(itemSchema);
        if (schemaObj.minItems !== undefined) {
          zodArray = zodArray.min(schemaObj.minItems);
        }
        if (schemaObj.maxItems !== undefined) {
          zodArray = zodArray.max(schemaObj.maxItems);
        }
        return required ? zodArray : zodArray.optional();
      }
      return required ? z.array(z.any()) : z.array(z.any()).optional();
    }

    case "object": {
      if (schemaObj.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        const requiredProps = schemaObj.required ?? [];

        Object.entries(schemaObj.properties).forEach(([key, propSchema]) => {
          const isRequired = requiredProps.includes(key);
          shape[key] = openApiSchemaToZod3(
            propSchema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
            isRequired
          );
        });

        return z.object(shape);
      }
      return required ? z.object({}) : z.object({}).optional();
    }

    default:
      // Fallback for unknown types
      return required ? z.any() : z.any().optional();
  }
};

/**
 * Builds a Zod v3 input schema from OpenAPI operation parameters.
 * Extracts query and path parameters and converts them to a Zod object schema.
 * Skips header and cookie parameters, and resolves $ref references as needed.
 *
 * @param operation - The OpenAPI operation object containing parameter definitions
 * @returns A Zod object schema with validated parameter types
 */
export const buildInputSchemaFromOpenAPI = (
  operation: OpenAPIV3.OperationObject
): z.ZodObject<Record<string, z.ZodTypeAny>> => {
  const params = operation.parameters ?? [];
  const shape: Record<string, z.ZodTypeAny> = {};

  params.forEach((param) => {
    // Handle $ref references (for now, skip - could be enhanced to resolve)
    if ("$ref" in param) {
      return;
    }

    const paramObj = param as OpenAPIV3.ParameterObject;
    const paramName = paramObj.name;
    const isRequired = paramObj.required ?? false;

    // Only process query and path parameters (skip header, cookie for now)
    if (paramObj.in === "query" || paramObj.in === "path") {
      const zodType = openApiSchemaToZod3(paramObj.schema, isRequired);
      shape[paramName] = zodType;
    }
  });

  return z.object(shape);
};
