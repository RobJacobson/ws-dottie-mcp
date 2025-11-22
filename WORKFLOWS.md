# ws-dottie-mcp Workflow Documentation

This document contains workflow patterns and best practices for using ws-dottie-mcp tools efficiently.

## Finding a Specific Vessel's Location

**Problem**: You need to find where a specific vessel (e.g., "Tacoma") is located.

**Inefficient Approach** ❌:
```typescript
// Don't do this - fetches ALL vessel locations
list_vessel_locations() 
// Then filter through results to find "Tacoma"
```

**Efficient Approach** ✅:
```typescript
// Step 1: Find the vessel's ID
list_vessel_basics() 
// Find "Tacoma" → VesselID: 32

// Step 2: Get only that vessel's location
get_vessel_locations_by_vessel_id(VesselID: 32)
```

**Why**: The list endpoint returns data for all active vessels (20+ vessels), while the by-ID endpoint returns only the specific vessel you need. This reduces payload size and improves performance.

## Getting Vessel Details

**Pattern**: When you need comprehensive information about a vessel:

1. `list_vessel_basics` - Get basic info and VesselID
2. `get_vessel_locations_by_vessel_id` - Get current location/status
3. `get_vessel_stats_by_vessel_id` - Get technical specifications (optional)
4. `get_vessels_verbose_by_vessel_id` - Get all data in one call (if you need everything)

**Tip**: Use `get_vessels_verbose_by_vessel_id` if you need multiple data types, as it combines basics, locations, stats, and accommodations in one call.

## Performance Best Practices

1. **Use specific endpoints over list endpoints** when you know what you're looking for
2. **Cache VesselIDs** - Vessel IDs don't change, so you can cache the mapping from vessel names to IDs
3. **Batch operations** - If you need multiple vessels, consider parallel calls to by-ID endpoints rather than filtering a large list

## Common Workflows

### "Where is [vessel name]?"
1. `list_vessel_basics` → find VesselID
2. `get_vessel_locations_by_vessel_id` → get location, destination, ETA

### "What vessels are currently at [terminal]?"
1. `list_vessel_locations` → filter by `AtDock: true` and terminal name
2. Note: This is one case where list endpoint is appropriate since you need to check multiple vessels

### "What are the specs of [vessel name]?"
1. `list_vessel_basics` → find VesselID
2. `get_vessel_stats_by_vessel_id` → get technical specifications

