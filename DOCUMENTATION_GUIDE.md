# Documentation Guide for ws-dottie-mcp

## Overview

This guide explains how to document workflows, tips, and best practices for MCP tools to help AI agents use them efficiently without context bloat.

## Best Practices for Documenting Workflows in MCP Tools

### 1. Tool Description Field (Primary Location)

The `description` field in tool registration is the **primary place** for workflow guidance. According to MCP specification, this field:
- Is read by LLMs to understand tool functionality
- Should be human-readable and detailed
- Can include workflow patterns and tips

**Best Practice**: Include:
- **What** the tool does
- **When** to use it (vs alternatives)
- **Common workflow patterns**
- **Performance tips**

**Example Enhancement**:
```typescript
description: `Get real-time location data for a specific vessel by VesselID.

WORKFLOW TIP: For better performance when querying a single vessel:
1. First call list_vessel_basics to find the vessel's VesselID by name
2. Then call this tool with the specific VesselID

This avoids fetching all vessel locations (which can be large) when you only need one vessel's data.

Example workflow:
- User asks: "Where is the Tacoma?"
- Step 1: list_vessel_basics → find VesselID: 32 for "Tacoma"
- Step 2: get_vessel_locations_by_vessel_id(VesselID: 32) → get location data

This two-step approach is more efficient than calling list_vessel_locations and filtering.`
```

### 2. Input Schema Descriptions

Add detailed descriptions to schema properties to guide parameter usage:

```typescript
inputSchema: z.object({
  VesselID: z.number().describe(
    "Numeric vessel identifier. Use list_vessel_basics first to find the VesselID for a vessel by name."
  ),
})
```

### 3. Dedicated Workflow Documentation Tool

Create a dedicated tool (like `get_ferries_workflow_docs`) that agents can query for:
- Workflow patterns
- Best practices
- Performance tips
- Common anti-patterns to avoid

**Benefits**:
- Agents can query on-demand (avoids context bloat)
- Can be versioned and updated independently
- Can include structured examples and patterns

### 4. Structured Documentation Files

Maintain markdown files (like `WORKFLOWS.md`) that:
- Document common patterns
- Explain why certain approaches are better
- Provide examples
- Can be referenced by tools

## Implementation Strategy

### Current Implementation

1. **Tool Descriptions**: Currently using endpoint descriptions from ws-dottie
   - **Enhancement Needed**: Add workflow tips to descriptions

2. **Workflow Documentation Tool**: `get_ferries_workflow_docs`
   - Provides structured workflow patterns
   - Queryable by topic
   - Returns JSON for easy parsing

3. **Documentation File**: `WORKFLOWS.md`
   - Human-readable reference
   - Can be loaded by workflow tool

### Recommended Enhancements

1. **Enhance Tool Descriptions**:
   ```typescript
   // In createDottieTool.ts
   const enhancedDescription = `${endpoint.endpointDescription}

   WORKFLOW TIP: ${getWorkflowTipForEndpoint(endpoint.functionName)}`;
   ```

2. **Add Workflow Metadata**:
   - Create a mapping of endpoint → workflow tips
   - Include in tool descriptions automatically

3. **Tool Relationships**:
   - Document which tools work well together
   - Suggest tool chains for common tasks

## Key Principles

### 1. Avoid Context Bloat
- **Don't**: Include all workflow docs in every tool description
- **Do**: Use dedicated workflow tool that agents query on-demand
- **Do**: Keep tool descriptions concise but informative

### 2. Make Workflows Discoverable
- **Do**: Include workflow hints in tool descriptions
- **Do**: Provide structured workflow documentation tool
- **Do**: Use clear, actionable language

### 3. Performance Guidance
- **Do**: Explain when to use list vs. by-ID endpoints
- **Do**: Document payload size considerations
- **Do**: Suggest caching strategies

### 4. Examples Over Explanations
- **Do**: Provide concrete examples
- **Do**: Show before/after comparisons
- **Do**: Include common use cases

## Example: Complete Workflow Documentation

### Tool Description (Enhanced)
```typescript
description: `Get real-time vessel location data for a specific vessel.

WORKFLOW: When finding a vessel by name:
1. Call list_vessel_basics to get VesselID
2. Call this tool with the VesselID

This avoids fetching all vessel locations (20+ vessels) when you only need one.

Example: Finding "Tacoma"
- list_vessel_basics() → VesselID: 32
- get_vessel_locations_by_vessel_id(VesselID: 32) → location data`
```

### Workflow Tool Response
```json
{
  "workflow": {
    "title": "Finding a Specific Vessel's Location",
    "pattern": "Two-step approach",
    "steps": [
      "list_vessel_basics → find VesselID",
      "get_vessel_locations_by_vessel_id → get location"
    ],
    "why": "Avoids fetching all vessel locations when you only need one"
  }
}
```

## References

- [MCP Specification - Tool Description](https://spec.modelcontextprotocol.io/)
- [MCP Best Practices](https://github.com/microsoft/mcp-for-beginners)
- Context7: Model Context Protocol documentation

## Summary

**Best Practices**:
1. ✅ Use tool `description` field for workflow hints
2. ✅ Create dedicated workflow documentation tool
3. ✅ Maintain structured documentation files
4. ✅ Provide concrete examples, not just explanations
5. ✅ Document performance considerations
6. ✅ Make workflows discoverable but not bloated

**Anti-Patterns to Avoid**:
1. ❌ Including all workflow docs in every tool description
2. ❌ Vague descriptions without examples
3. ❌ Not documenting tool relationships
4. ❌ Missing performance guidance

