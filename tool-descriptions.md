# MCP Tool Descriptions

This document contains the descriptions for all MCP tools provided by ws-dottie-mcp.

## get_border_crossings

**Title:** Get Border Crossings

Purpose: List current wait times for all Washington border crossings into Canada.
Use when:
- Checking border crossing wait times
- Planning international travel timing
- Monitoring border congestion
Inputs: none
Returns: array — one item per border crossing
Output highlights:
- IDs: CrossingName (crossing code like I5, SR543Trucks)
- Location: BorderCrossingLocation (route, coordinates, description)
- Time: Time (UTC timestamp of observation)
- Wait times: WaitTime (minutes, -1 when unavailable)

---

## get_bridge_clearances

**Title:** Get Bridge Clearances

Purpose: List vertical clearance data for all Washington State bridges.
Use when:
- Comprehensive bridge database analysis
- Bulk data export for external systems
- Complete state-wide bridge inventory
Avoid when:
- You only need bridges on specific routes (prefer get_bridge_clearances_by_route)
Inputs: none
Returns: array — one item per bridge
Output highlights:
- IDs: BridgeNumber (route/structure), StateStructureId, CrossingLocationId
- Location: Latitude, Longitude, SRMP (milepost), StateRouteID
- Clearance: VerticalClearanceMaximumInches/MinimumInches (in inches), VerticalClearanceMaximumFeetInch/MinimumFeetInch (formatted)
- Metadata: CrossingDescription, APILastUpdate, RouteDate
- Large dataset: thousands of bridges with detailed location and clearance data
Chaining:
- get_bridge_clearances → extract StateRouteID → call get_bridge_clearances_by_route with { Route: ... } (for route-specific filtering)

---

## get_bridge_clearances_by_route

**Title:** Get Bridge Clearances By Route

Purpose: Get vertical clearance data for bridges on a specific state route.
Use when:
- Route planning with height restrictions
- Bridge clearance verification for specific highways
- Targeted bridge data analysis by route
Avoid when:
- You need bridges across all routes (prefer get_bridge_clearances)
Inputs:
- Route: three-digit route identifier, e.g., '005' for I-5, '167' for SR-167
Returns: array — one item per bridge on the specified route
Output highlights:
- IDs: BridgeNumber (route/structure), StateStructureId, CrossingLocationId
- Location: Latitude, Longitude, SRMP (milepost), StateRouteID
- Clearance: VerticalClearanceMaximumInches/MinimumInches (in inches), VerticalClearanceMaximumFeetInch/MinimumFeetInch (formatted)
- Metadata: CrossingDescription, APILastUpdate, RouteDate
- Route-filtered: subset of bridges specific to requested route
Chaining:
- get_bridge_clearances → extract StateRouteID → call get_bridge_clearances_by_route (to filter to specific route)

---

## get_commercial_vehicle_restrictions

**Title:** Get Commercial Vehicle Restrictions

Purpose: List commercial vehicle restrictions for all Washington State highways.
Use when:
- Statewide commercial vehicle routing analysis
- Bulk restriction data export
- Comprehensive restriction database queries
Avoid when:
- You need unique identifiers for restrictions (prefer get_commercial_vehicle_restrictions_with_id)
Inputs: none
Returns: array — one item per commercial vehicle restriction
Output highlights:
- Location: StateRouteID, Latitude/Longitude, StartRoadwayLocation/EndRoadwayLocation, LocationDescription
- Restrictions: MaximumGrossVehicleWeightInPounds, RestrictionHeightInInches/WidthInInches/LengthInInches, RestrictionWeightInPounds
- Vehicle classes: BLMaxAxle, CL8MaxAxle, SAMaxAxle, TDMaxAxle (weight limits by vehicle classification)
- Bridge info: BridgeName, BridgeNumber, RestrictionType (0=bridge, 1=road)
- Dates: DateEffective, DateExpires, DatePosted
- Status: IsPermanentRestriction, IsWarning, IsDetourAvailable, IsExceptionsAllowed
- Large dataset: thousands of restrictions with detailed weight/height limits and location data

---

## get_commercial_vehicle_restrictions_with_id

**Title:** Get Commercial Vehicle Restrictions With Id

Purpose: List commercial vehicle restrictions with unique identifiers for all Washington State highways.
Use when:
- Statewide commercial vehicle routing analysis with unique tracking
- Bulk restriction data export with identifiers
- Comprehensive restriction database queries requiring unique IDs
Avoid when:
- You don't need unique restriction identifiers (prefer get_commercial_vehicle_restrictions)
Inputs: none
Returns: array — one item per commercial vehicle restriction
Output highlights:
- IDs: UniqueID (format 'Type-State-Route-Sequence', e.g., 'B-WA-010-1')
- Location: StateRouteID, Latitude/Longitude, StartRoadwayLocation/EndRoadwayLocation, LocationDescription
- Restrictions: MaximumGrossVehicleWeightInPounds, RestrictionHeightInInches/WidthInInches/LengthInInches, RestrictionWeightInPounds
- Vehicle classes: BLMaxAxle, CL8MaxAxle, SAMaxAxle, TDMaxAxle (weight limits by vehicle classification)
- Bridge info: BridgeName, BridgeNumber, RestrictionType (0=bridge, 1=road)
- Dates: DateEffective, DateExpires, DatePosted
- Status: IsPermanentRestriction, IsWarning, IsDetourAvailable, IsExceptionsAllowed
- Large dataset: thousands of restrictions with detailed weight/height limits, location data, and unique identifiers

---

## get_alerts

**Title:** Get Alerts

Purpose: List all currently active highway alerts across Washington State.
Use when:
- Monitoring statewide traffic conditions
- Building comprehensive alert dashboards
- One-time bulk export of all active incidents
Avoid when:
- You only need alerts for specific regions (prefer get_alerts_by_region_id)
- You only need alerts for specific map areas (prefer get_alerts_by_map_area)
- You need filtered results (prefer searchAlerts)
Inputs: none
Returns: array — one item per active highway alert
Output highlights:
- IDs: AlertID (unique numeric identifier)
- Status: EventStatus ('Open' = active, 'Closed' = resolved)
- Priority: Priority ('Highest'/'High'/'Medium'/'Low' traffic impact)
- Location: StartRoadwayLocation/EndRoadwayLocation with road, milepost, coordinates
- Time: StartTime (when incident began), EndTime (estimated resolution), LastUpdatedTime
- Category: EventCategory (type like 'Construction', 'Collision', 'Maintenance')
- Descriptions: HeadlineDescription (summary), ExtendedDescription (details)
- Large payload: ~100-200+ alerts with detailed location and text data
Chaining:
- get_alerts → extract AlertID → call get_alert_by_id with { AlertID: ... }
- get_alerts → extract Region → call get_alerts_by_region_id with { RegionID: ... }
- get_alerts → extract EventCategory → call searchAlerts with { EventCategory: ... }

---

## get_search_alerts

**Title:** Get Search Alerts

Purpose: Search highway alerts using flexible filters for route, region, time range, and milepost.
Use when:
- Finding alerts on specific highways or routes
- Filtering alerts by geographic regions or time periods
- Getting alerts within milepost ranges on highways
- Building targeted alert queries
Avoid when:
- You need all statewide alerts (prefer get_alerts)
- You need alerts for specific map areas (prefer get_alerts_by_map_area)
- You only need one specific alert (prefer get_alert_by_id)
Inputs:
- StateRoute: three-digit route number like '405'
- Region: numeric ID (7=Eastern, 8=North Central, 9=Northwest, 10=Olympic, 11=South Central, 12=Southwest)
- SearchTimeStart: ISO-8601 UTC format
- SearchTimeEnd: ISO-8601 UTC format
- StartingMilepost: for route segments
- EndingMilepost: for route segments
Returns: array — one item per alert matching search criteria
Output highlights:
- IDs: AlertID (unique numeric identifier)
- Status: EventStatus ('Open' = active, 'Closed' = resolved)
- Priority: Priority ('Highest'/'High'/'Medium'/'Low' traffic impact)
- Location: StartRoadwayLocation/EndRoadwayLocation with road, milepost, coordinates
- Time: StartTime (when incident began), EndTime (estimated resolution), LastUpdatedTime
- Category: EventCategory (type like 'Construction', 'Collision', 'Maintenance')
- Descriptions: HeadlineDescription (summary), ExtendedDescription (details)
- Filtered results: smaller payload than statewide get_alerts
Chaining:
- get_event_categories → extract category name → call searchAlerts with { EventCategory: ... }
- searchAlerts → extract AlertID → call get_alert_by_id with { AlertID: ... }

---

## get_alerts_by_region_id

**Title:** Get Alerts By Region Id

Purpose: List highway alerts filtered by WSDOT administrative region.
Use when:
- Focusing on alerts in specific geographic regions
- Building regional alert dashboards
- Reducing payload size compared to statewide alerts
Avoid when:
- You need alerts for specific map areas (prefer get_alerts_by_map_area)
- You need filtered results with multiple criteria (prefer searchAlerts)
- You need all statewide alerts (prefer get_alerts)
Inputs:
- RegionID: numeric (7=Eastern, 8=North Central, 9=Northwest, 10=Olympic, 11=South Central, 12=Southwest)
Returns: array — one item per alert in the specified region
Output highlights:
- IDs: AlertID (unique numeric identifier)
- Status: EventStatus ('Open' = active, 'Closed' = resolved)
- Priority: Priority ('Highest'/'High'/'Medium'/'Low' traffic impact)
- Location: StartRoadwayLocation/EndRoadwayLocation with road, milepost, coordinates
- Time: StartTime (when incident began), EndTime (estimated resolution), LastUpdatedTime
- Category: EventCategory (type like 'Construction', 'Collision', 'Maintenance')
- Descriptions: HeadlineDescription (summary), ExtendedDescription (details)
- Regional focus: smaller payload than statewide get_alerts
Chaining:
- get_alerts_by_region_id → extract AlertID → call get_alert_by_id with { AlertID: ... }
- get_alerts_by_region_id → extract EventCategory → call searchAlerts with { Region: ..., EventCategory: ... }

---

## get_alerts_by_map_area

**Title:** Get Alerts By Map Area

Purpose: List highway alerts filtered by geographic map area code.
Use when:
- Focusing on alerts in specific local areas
- Building city or neighborhood alert displays
- Reducing payload size for targeted geographic queries
Avoid when:
- You need alerts for administrative regions (prefer get_alerts_by_region_id)
- You need filtered results with multiple criteria (prefer searchAlerts)
- You need all statewide alerts (prefer get_alerts)
Inputs:
- MapArea: code from get_map_areas like 'L2PS' for Puget Sound, 'L2SE' for Seattle
Returns: array — one item per alert in the specified map area
Output highlights:
- IDs: AlertID (unique numeric identifier)
- Status: EventStatus ('Open' = active, 'Closed' = resolved)
- Priority: Priority ('Highest'/'High'/'Medium'/'Low' traffic impact)
- Location: StartRoadwayLocation/EndRoadwayLocation with road, milepost, coordinates
- Time: StartTime (when incident began), EndTime (estimated resolution), LastUpdatedTime
- Category: EventCategory (type like 'Construction', 'Collision', 'Maintenance')
- Descriptions: HeadlineDescription (summary), ExtendedDescription (details)
- Localized focus: smaller payload than statewide or regional queries
Chaining:
- get_map_areas → extract MapArea → call get_alerts_by_map_area with { MapArea: ... }
- get_alerts_by_map_area → extract AlertID → call get_alert_by_id with { AlertID: ... }

---

## get_alert_by_id

**Title:** Get Alert By Id

Purpose: Get complete details for a single highway alert by its unique ID.
Use when:
- Getting full details for a specific alert
- Enriching alert data from bulk queries
- Displaying individual alert detail pages
- Minimizing payload when you only need one alert
Avoid when:
- You need multiple alerts (prefer bulk endpoints like get_alerts or searchAlerts)
- You don't have an AlertID (prefer bulk endpoints to discover IDs)
Inputs:
- AlertID: numeric ID from bulk alert queries like get_alerts → AlertID
Returns: object — complete details for one highway alert
Output highlights:
- IDs: AlertID, links to related location/route data
- Status: EventStatus ('Open'/'Closed'), Priority ('Highest'/'High'/'Medium'/'Low')
- Location: StartRoadwayLocation/EndRoadwayLocation with precise coordinates, mileposts, road details
- Time: StartTime (incident began), EndTime (estimated resolution), LastUpdatedTime (last modified)
- Category: EventCategory (incident type), Region (administrative area)
- Descriptions: HeadlineDescription (impact summary), ExtendedDescription (full details)
- County: affected county name when applicable
- Complete details: includes all fields available for the alert
Chaining:
- get_alerts → extract AlertID → call get_alert_by_id with { AlertID: ... }
- searchAlerts → extract AlertID → call get_alert_by_id with { AlertID: ... }
- get_alerts_by_region_id → extract AlertID → call get_alert_by_id with { AlertID: ... }
- get_alerts_by_map_area → extract AlertID → call get_alert_by_id with { AlertID: ... }

---

## get_map_areas

**Title:** Get Map Areas

Purpose: List all available geographic map areas for filtering highway alerts by region.
Use when:
- Discovering available map area codes for filtering alerts
- Building regional filter interfaces
- Obtaining valid area identifiers for alert queries
Inputs: none
Returns: array — one item per map area
Output highlights:
- IDs: MapArea (region code like 'L2PS' for Puget Sound)
- Names: MapAreaDescription (display name like 'Puget Sound')
- Coverage: includes statewide regions and local camera areas
- Count: ~45 areas total
- Null handling: both fields may be null in rare cases
Chaining:
- get_map_areas → extract MapArea → call get_alerts_by_map_area with { MapArea: ... }

---

## get_event_categories

**Title:** Get Event Categories

Purpose: List all available event category names for filtering highway alerts by incident type.
Use when:
- Discovering valid event category names for alert searches
- Building category filter interfaces
- Understanding available alert classification types
Inputs: none
Returns: array — one item per event category name
Output highlights:
- Categories: string names like 'Construction', 'Collision', 'Weather'
- Coverage: includes incidents, maintenance, weather, and emergency types
- Count: ~120 categories total
- Usage: use exact category names for filtering in searchAlerts
- Special: includes empty string as first item
Chaining:
- get_event_categories → extract category name → call searchAlerts with { EventCategory: ... }

---

## get_search_highway_cameras_by_route_and_milepost

**Title:** Get Search Highway Cameras By Route And Milepost

Purpose: Search highway cameras using flexible filters for route, region, and milepost range.
Use when:
- Finding cameras along specific highways or routes
- Getting cameras within milepost ranges on highways
- Building route-specific camera displays
- Filtering cameras by geographic regions
Avoid when:
- You need all statewide cameras (prefer get_highway_cameras)
- You only need one specific camera (prefer get_highway_camera_by_camera_id)
Inputs:
- StateRoute: like 'I-5', 'I-90'
- Region: optional region filter
- StartingMilepost: optional milepost range
- EndingMilepost: optional milepost range
Returns: array — one item per camera matching search criteria
Output highlights:
- IDs: CameraID (unique numeric identifier)
- Location: CameraLocation (route, milepost, direction), DisplayLatitude/DisplayLongitude
- Image: ImageURL (camera feed URL), ImageWidth/ImageHeight (dimensions)
- Status: IsActive (true = operational)
- Metadata: Title (display name), Description (purpose/location info)
- Ownership: CameraOwner, OwnerURL, Region (administrative area)
- Display: SortOrder (for location-based sorting)
- Filtered results: smaller payload than statewide get_highway_cameras
Chaining:
- searchHighwayCamerasByRouteAndMilepost → extract CameraID → call get_highway_camera_by_camera_id with { CameraID: ... }
- get_highway_cameras → extract CameraLocation.RoadName → call searchHighwayCamerasByRouteAndMilepost with { StateRoute: ... }

---

## get_highway_camera_by_camera_id

**Title:** Get Highway Camera By Camera Id

Purpose: Get complete details for a single highway camera by its unique ID.
Use when:
- Getting full details for a specific camera
- Enriching camera data from bulk queries
- Displaying individual camera detail pages
- Minimizing payload when you only need one camera
Avoid when:
- You need multiple cameras (prefer bulk endpoints like get_highway_cameras or searchHighwayCamerasByRouteAndMilepost)
- You don't have a CameraID (prefer bulk endpoints to discover IDs)
Inputs:
- CameraID: numeric ID from bulk camera queries like get_highway_cameras → CameraID
Returns: object — complete details for one highway camera
Output highlights:
- IDs: CameraID, links to related location data
- Location: CameraLocation (route, milepost, direction), DisplayLatitude/DisplayLongitude (precise coordinates)
- Image: ImageURL (live camera feed), ImageWidth/ImageHeight (dimensions for display)
- Status: IsActive (true = operational and updating)
- Metadata: Title (display name), Description (purpose/location context)
- Ownership: CameraOwner (agency), OwnerURL (agency website), Region (administrative area)
- Display: SortOrder (for location-based sorting in interfaces)
- Complete details: includes all available camera information and metadata
Chaining:
- get_highway_cameras → extract CameraID → call get_highway_camera_by_camera_id with { CameraID: ... }
- searchHighwayCamerasByRouteAndMilepost → extract CameraID → call get_highway_camera_by_camera_id with { CameraID: ... }

---

## get_highway_cameras

**Title:** Get Highway Cameras

Purpose: List all highway traffic cameras across Washington State.
Use when:
- Building comprehensive camera directory applications
- One-time bulk export of all camera locations
- Discovering CameraID values for targeted queries
Avoid when:
- You only need cameras on specific routes (prefer searchHighwayCamerasByRouteAndMilepost)
- You only need one specific camera (prefer get_highway_camera_by_camera_id)
- Building user-facing camera picker interfaces (prefer filtered endpoints)
Inputs: none
Returns: array — one item per highway camera
Output highlights:
- IDs: CameraID (unique numeric identifier)
- Location: CameraLocation (route, milepost, direction), DisplayLatitude/DisplayLongitude
- Image: ImageURL (camera feed URL), ImageWidth/ImageHeight (dimensions)
- Status: IsActive (true = operational)
- Metadata: Title (display name), Description (purpose/location info)
- Ownership: CameraOwner, OwnerURL, Region (administrative area)
- Display: SortOrder (for location-based sorting)
- Large payload: ~500+ cameras with detailed location and metadata
Chaining:
- get_highway_cameras → extract CameraID → call get_highway_camera_by_camera_id with { CameraID: ... }
- get_highway_cameras → extract CameraLocation.RoadName → call searchHighwayCamerasByRouteAndMilepost with { StateRoute: ... }

---

## get_mountain_pass_conditions

**Title:** Get Mountain Pass Conditions

Purpose: List current weather, road conditions, and travel restrictions for all monitored mountain passes in Washington State.
Use when:
- Planning winter travel across mountain passes
- Monitoring statewide pass conditions and restrictions
- Building comprehensive pass condition dashboards
- Checking multiple passes for route planning
Avoid when:
- You only need conditions for one specific pass (prefer get_mountain_pass_condition_by_id)
Inputs: none
Returns: array — one item per monitored mountain pass
Output highlights:
- IDs: MountainPassId (unique numeric identifier)
- Location: MountainPassName, Latitude/Longitude coordinates, ElevationInFeet
- Weather: WeatherCondition (current conditions), TemperatureInFahrenheit
- Road: RoadCondition (surface status)
- Restrictions: RestrictionOne/RestrictionTwo (direction-specific travel restrictions with text)
- Status: TravelAdvisoryActive (true = advisory in effect), DateUpdated (last refresh)
- Directional data: separate restrictions for each travel direction
- Small dataset: ~15 monitored passes with comprehensive condition data
Chaining:
- get_mountain_pass_conditions → extract MountainPassId → call get_mountain_pass_condition_by_id with { PassConditionID: ... }

---

## get_mountain_pass_condition_by_id

**Title:** Get Mountain Pass Condition By Id

Purpose: Get complete current conditions and travel restrictions for a single mountain pass by its unique ID.
Use when:
- Getting detailed conditions for a specific pass
- Enriching pass data from bulk queries
- Displaying individual pass detail pages
- Checking conditions before traveling a specific pass
- Minimizing payload when you only need one pass
Avoid when:
- You need conditions for multiple passes (prefer get_mountain_pass_conditions)
- You don't have a PassConditionID (prefer get_mountain_pass_conditions to discover IDs)
Inputs:
- PassConditionID: numeric ID from bulk queries like get_mountain_pass_conditions → MountainPassId
Returns: object — complete conditions for one mountain pass
Output highlights:
- IDs: MountainPassId, links to location data
- Location: MountainPassName, Latitude/Longitude coordinates, ElevationInFeet
- Weather: WeatherCondition (current conditions), TemperatureInFahrenheit
- Road: RoadCondition (surface status like 'Snow Packed', 'Ice')
- Restrictions: RestrictionOne/RestrictionTwo (direction-specific with TravelDirection and RestrictionText)
- Status: TravelAdvisoryActive (true = advisory in effect), DateUpdated (last refresh time)
- Directional safety: separate restrictions for each travel direction
- Complete details: includes all available weather, road, and restriction information
Chaining:
- get_mountain_pass_conditions → extract MountainPassId → call get_mountain_pass_condition_by_id with { PassConditionID: ... }

---

## get_toll_rates

**Title:** Get Toll Rates

Purpose: List current toll rates for all HOV toll lanes statewide.
Use when:
- Route planning with toll costs
- Comparing toll rates across different lanes
- Toll pricing analysis
Avoid when:
- You only need toll rates for specific trips (prefer get_toll_trip_rates)
Inputs: none
Returns: array — one item per toll lane segment
Output highlights:
- Locations: StartLocationName/EndLocationName with coordinates and mileposts
- Toll pricing: CurrentToll (cents), CurrentMessage (sign display text)
- Route info: StateRoute (e.g., '099', '405'), TravelDirection, TripName
- Timing: TimeUpdated (UTC timestamp for last rate change)
- Coordinates: Start/End Latitude/Longitude for mapping

---

## get_toll_trip_info

**Title:** Get Toll Trip Info

Purpose: List trip information for all toll trips statewide.
Use when:
- Mapping toll routes and lanes
- Understanding toll trip geography
- Route planning with location data
Avoid when:
- You only need pricing information (prefer get_toll_rates)
- You need current toll amounts (prefer get_toll_rates)
Inputs: none
Returns: array — one item per toll trip route
Output highlights:
- Locations: StartLocationName/EndLocationName with milepost markers
- Coordinates: Start/End Latitude/Longitude for precise mapping
- Route details: TravelDirection, TripName (unique route identifier)
- Geometry: Encoded route geometry data for visualization (may be null)
- Metadata: ModifiedDate showing when route info was last updated

---

## get_toll_trip_rates

**Title:** Get Toll Trip Rates

Purpose: Get current toll rates for all trips.
Use when:
- Comprehensive toll pricing across all routes
- Version tracking for toll data changes
- Bulk toll rate analysis
Avoid when:
- You only need HOV lane tolls (prefer get_toll_rates)
- You need historical rates (prefer get_trip_rates_by_date)
Inputs: none
Returns: object — container with version, update time, and array of all trip rates
Output highlights:
- Container: LastUpdated (UTC timestamp), Version (data version number)
- Trips array: each item has TripName, Toll (dollars), Message, MessageUpdateTime
- Rate details: Message (display text like '$4.95' or 'FREE'), MessageUpdateTime
- Trip identification: TripName (unique route identifier)
- Null handling: Trips array may be null when rates unavailable
Chaining:
- get_toll_trip_rates → extract Version → call get_trip_rates_by_version with { Version: ... }

---

## get_trip_rates_by_date

**Title:** Get Trip Rates By Date

Purpose: Get historical toll rates for a specified date range.
Use when:
- Analyzing toll rate changes over time
- Historical toll cost comparisons
- Trend analysis for toll pricing
Avoid when:
- You need current rates only (prefer get_toll_trip_rates)
- You need rates for a specific version (prefer get_trip_rates_by_version)
Inputs:
- FromDate: YYYY-MM-DD format
- ToDate: YYYY-MM-DD format
Returns: array — one item per day in date range, each containing trip rates for that day
Output highlights:
- Array structure: one TollTripsRates object per day in the date range
- Each day: LastUpdated, Version, Trips array with rate details
- Rate details: TripName, Toll amount, Message text, MessageUpdateTime
- Version tracking: each day has its own version number
- Large payload: returns historical data for entire date range

---

## get_trip_rates_by_version

**Title:** Get Trip Rates By Version

Purpose: Get toll rates for a specific version number.
Use when:
- Accessing toll rates from a known historical version
- Version-specific rate comparison
- Reproducing past toll calculations
Avoid when:
- You need current rates (prefer get_toll_trip_rates)
- You need rates for a date range (prefer get_trip_rates_by_date)
Inputs:
- Version: numeric version number from get_toll_trip_rates Version field
Returns: object — toll rates container for the specified version
Output highlights:
- Container: LastUpdated (when this version was created), Version (matches input)
- Trips array: complete set of trip rates for this version
- Rate details: TripName, Toll amount, Message text, MessageUpdateTime
- Version consistency: all rates in this response are from the same version
- Historical access: allows retrieving past rate configurations
Chaining:
- get_toll_trip_rates → extract Version → call get_trip_rates_by_version with { Version: ... }

---

## get_toll_trip_version

**Title:** Get Toll Trip Version

Purpose: Get current version and timestamp for toll trip data.
Use when:
- Checking if toll data has been updated
- Version tracking for caching decisions
- Determining when to refresh toll rate data
Avoid when:
- You need the actual toll rates (prefer get_toll_trip_rates)
Inputs: none
Returns: object — current version number and timestamp
Output highlights:
- Version: numeric version number that increments when toll rates change
- TimeStamp: UTC datetime when this version was created/updated
- Change detection: compare Version to detect toll rate updates
- Caching: use for determining when to refresh cached toll data

---

## get_traffic_flows

**Title:** Get Traffic Flows

Purpose: List current traffic flow conditions for all stations statewide.
Use when:
- Comprehensive traffic analysis across all regions
- Finding available traffic stations for mapping
- Bulk traffic monitoring
Avoid when:
- You only need one station's data (prefer get_traffic_flow_by_id)
- Payload size is a concern (returns thousands of stations)
Inputs: none
Returns: array — one item per traffic flow station
Output highlights:
- Station info: FlowDataID (unique identifier), StationName (route-direction-milepost code)
- Flow condition: FlowReadingValue (0=Unknown, 1=WideOpen, 2=Moderate, 3=Heavy, 4=StopAndGo, 5=NoData)
- Location: FlowStationLocation with coordinates, direction, milepost, road name
- Region: WSDOT region maintaining the station
- Timing: Time (UTC timestamp of last reading)
Chaining:
- get_traffic_flows → extract FlowDataID → call get_traffic_flow_by_id with { FlowDataID: ... }

---

## get_traffic_flow_by_id

**Title:** Get Traffic Flow By Id

Purpose: Get current traffic flow condition for a specific station by ID.
Use when:
- Monitoring specific traffic station
- Getting detailed flow data for one location
- Focused traffic analysis
Avoid when:
- You need data for multiple stations (prefer get_traffic_flows)
Inputs:
- FlowDataID: numeric station identifier from get_traffic_flows FlowDataID field
Returns: object — traffic flow data for one specific station
Output highlights:
- Station identity: FlowDataID, StationName (route-direction-milepost code)
- Traffic condition: FlowReadingValue (1=WideOpen, 2=Moderate, 3=Heavy, 4=StopAndGo)
- Location details: FlowStationLocation with precise coordinates and road information
- Administrative: Region (WSDOT maintenance region)
- Freshness: Time (UTC timestamp, updated every 90 seconds)
Chaining:
- get_traffic_flows → extract FlowDataID → call get_traffic_flow_by_id with { FlowDataID: ... }

---

## get_travel_times

**Title:** Get Travel Times

Purpose: List travel time data for all available routes.
Use when:
- Route planning with current travel times
- Comparing travel times across multiple routes
- Finding available travel time routes for mapping
Avoid when:
- You only need one route's data (prefer get_travel_time_by_id)
Inputs: none
Returns: array — one item per travel time route
Output highlights:
- Route identity: TravelTimeID, Name (display name), Description
- Travel times: CurrentTime (current minutes), AverageTime (historical average minutes)
- Distance: route length in miles from start to end
- Locations: StartPoint and EndPoint with coordinates, road names, mileposts
- Timing: TimeUpdated (UTC timestamp of last update)
Chaining:
- get_travel_times → extract TravelTimeID → call get_travel_time_by_id with { TravelTimeID: ... }

---

## get_travel_time_by_id

**Title:** Get Travel Time By Id

Purpose: Get travel time data for a specific route by ID.
Use when:
- Monitoring specific travel route
- Getting detailed travel time for one route
- Route-specific travel planning
Avoid when:
- You need data for multiple routes (prefer get_travel_times)
Inputs:
- TravelTimeID: numeric route identifier from get_travel_times TravelTimeID field
Returns: object — travel time data for one specific route
Output highlights:
- Route details: TravelTimeID, Name, Description of the travel route
- Current conditions: CurrentTime (real-time travel minutes), AverageTime (baseline)
- Route metrics: Distance (miles), start/end point coordinates and road information
- Location data: StartPoint and EndPoint with detailed roadway location info
- Data freshness: TimeUpdated (UTC timestamp of last measurement)
Chaining:
- get_travel_times → extract TravelTimeID → call get_travel_time_by_id with { TravelTimeID: ... }

---

## get_weather_information

**Title:** Get Weather Information

Purpose: List current atmospheric conditions from all WSDOT Road Weather Information System stations statewide.
Use when:
- Building statewide weather maps
- Monitoring road conditions across regions
- Needing comprehensive weather data for analysis
Avoid when:
- You only need data for one station (prefer get_weather_information_by_station_id)
- You need weather for specific stations (prefer get_current_weather_for_stations)
Inputs: none
Returns: array — one item per weather station
Output highlights:
- StationID and StationName for identification
- Latitude/Longitude coordinates for mapping
- TemperatureInFahrenheit, RelativeHumidity, and PrecipitationInInches for conditions
- WindSpeedInMPH, WindDirection, and WindGustSpeedInMPH for wind data
- BarometricPressure and Visibility for atmospheric conditions
- ReadingTime as UTC timestamp when measurements were taken
- Some fields may be null when sensors are unavailable
Chaining:
- get_weather_stations → extract StationID → call get_weather_information_by_station_id with { StationID: ... }
- get_weather_stations → extract multiple StationIDs → call get_current_weather_for_stations with { StationList: ... }

---

## get_weather_information_by_station_id

**Title:** Get Weather Information By Station Id

Purpose: Get current atmospheric conditions from a specific WSDOT Road Weather Information System station.
Use when:
- Monitoring conditions at a specific location
- Getting weather data for a known station
- Building detailed views for individual stations
Avoid when:
- You need data for multiple stations (prefer get_current_weather_for_stations or get_weather_information)
Inputs:
- StationID: from get_weather_stations → StationID
Returns: object — one weather station profile
Output highlights:
- StationID and StationName for identification
- Latitude/Longitude coordinates for mapping
- TemperatureInFahrenheit, RelativeHumidity, and PrecipitationInInches for conditions
- WindSpeedInMPH, WindDirection, and WindGustSpeedInMPH for wind data
- BarometricPressure and Visibility for atmospheric conditions
- ReadingTime as UTC timestamp when measurements were taken
- Fields may be null when sensors are unavailable
Chaining:
- get_weather_stations → extract StationID → call get_weather_information_by_station_id with { StationID: ... }

---

## get_current_weather_for_stations

**Title:** Get Current Weather For Stations

Purpose: Get current atmospheric conditions from multiple specific WSDOT Road Weather Information System stations.
Use when:
- Monitoring a specific set of known stations
- Building dashboards for selected locations
- Needing weather data for targeted regions
Avoid when:
- You need all stations statewide (prefer get_weather_information)
- You only need one station (prefer get_weather_information_by_station_id)
Inputs:
- StationList: comma-separated StationIDs from get_weather_stations → StationID
Returns: array — one item per requested station
Output highlights:
- StationID and StationName for identification
- Latitude/Longitude coordinates for mapping
- TemperatureInFahrenheit, RelativeHumidity, and PrecipitationInInches for conditions
- WindSpeedInMPH, WindDirection, and WindGustSpeedInMPH for wind data
- BarometricPressure and Visibility for atmospheric conditions
- ReadingTime as UTC timestamp when measurements were taken
- Some fields may be null when sensors are unavailable
Chaining:
- get_weather_stations → extract multiple StationIDs → call get_current_weather_for_stations with { StationList: ... }

---

## get_search_weather_information

**Title:** Get Search Weather Information

Purpose: Search historical atmospheric conditions from a WSDOT Road Weather Information System station over a specified time range.
Use when:
- Analyzing weather patterns over time
- Building historical weather reports
- Studying weather conditions for specific periods
Avoid when:
- You need current conditions (prefer get_weather_information_by_station_id)
- You need data for multiple stations (prefer get_weather_information)
Inputs:
- StationID: from get_weather_stations → StationID
- SearchStartTime: ISO-8601 UTC format
- SearchEndTime: ISO-8601 UTC format
Returns: array — one item per reading timestamp
Output highlights:
- StationID and StationName for identification
- Latitude/Longitude coordinates for mapping
- TemperatureInFahrenheit, RelativeHumidity, and PrecipitationInInches for conditions
- WindSpeedInMPH, WindDirection, and WindGustSpeedInMPH for wind data
- BarometricPressure and Visibility for atmospheric conditions
- ReadingTime as UTC timestamp when each measurement was taken
- Some fields may be null when sensors were unavailable
Chaining:
- get_weather_stations → extract StationID → call searchWeatherInformation with { StationID: ..., SearchStartTime: ..., SearchEndTime: ... }

---

## get_weather_readings

**Title:** Get Weather Readings

Purpose: List comprehensive weather readings from all WSDOT weather stations, including atmospheric conditions, precipitation data, and embedded surface/subsurface sensor measurements.
Use when:
- Needing complete weather station data for analysis
- Building comprehensive weather monitoring systems
- Accessing all available sensor measurements in one request
Avoid when:
- You only need surface measurements (prefer get_surface_measurements)
- You only need subsurface measurements (prefer get_sub_surface_measurements)
- You need data for specific stations (prefer weather-information endpoints)
Inputs: none
Returns: array — one item per weather station
Output highlights:
- StationId (NWS code), StationName, Latitude/Longitude, and Elevation for station identification
- ReadingTime as UTC timestamp when comprehensive reading was taken
- AirTemperature in Celsius, RelativeHumidty percentage, and BarometricPressure in millibars
- Wind data: AverageWindSpeed/AverageWindDirection in km/h and degrees, WindGust in km/h
- Visibility in meters and comprehensive precipitation data across multiple time periods
- PrecipitationType codes: 0=none, 1=rain, 2=snow with intensity and accumulation measurements
- SnowDepth in centimeters for winter conditions
- SurfaceMeasurements array with pavement temperatures, freezing points, and road condition codes
- SubSurfaceMeasurements array with ground temperatures from sensors below pavement
- Extremely comprehensive payload - largest response of all weather endpoints
Chaining:
- get_weather_stations → extract StationId → correlate with weather readings data

---

## get_surface_measurements

**Title:** Get Surface Measurements

Purpose: List pavement surface measurements including temperature, freezing point, and road condition from sensors embedded in or mounted on road surfaces.
Use when:
- Monitoring road surface temperatures
- Assessing freezing conditions and road safety
- Analyzing pavement moisture and ice conditions
Avoid when:
- You need subsurface measurements (prefer get_sub_surface_measurements)
- You need comprehensive weather data (prefer get_weather_readings)
Inputs: none
Returns: array — one item per surface sensor
Output highlights:
- SensorId for sensor identification
- SurfaceTemperature in Celsius from pavement surface sensors
- RoadFreezingTemperature in Celsius based on chemical treatment of moisture
- RoadSurfaceCondition code: 101=Dry, 102=Wet, 103=Moist, 104=Ice, 105=Snow, 108=Unknown
- Critical for winter road maintenance and safety assessments
- Sensor fields may be undefined when sensors are offline
Chaining:
- get_weather_stations → extract StationID → correlate with surface measurements

---

## get_sub_surface_measurements

**Title:** Get Sub Surface Measurements

Purpose: List subsurface temperature measurements from sensors embedded 12-18 inches below road pavement at WSDOT weather stations.
Use when:
- Monitoring subsurface road temperatures
- Analyzing pavement conditions
- Studying ground temperature patterns
Avoid when:
- You need surface-level measurements (prefer get_surface_measurements)
- You need comprehensive weather data (prefer get_weather_readings)
Inputs: none
Returns: array — one item per subsurface sensor
Output highlights:
- SensorId for sensor identification
- SubSurfaceTemperature in Celsius from sensors 12-18 inches below pavement
- Measurements help assess pavement conditions and freeze/thaw cycles
- SensorId may be undefined for some sensors
- Temperature values may be undefined when sensors are offline
Chaining:
- get_weather_stations → extract StationID → correlate with subsurface measurements

---

## get_weather_stations

**Title:** Get Weather Stations

Purpose: List metadata for all WSDOT Road Weather Information System stations statewide, providing station identifiers and locations needed for other weather endpoints.
Use when:
- Discovering available weather stations
- Building station picker interfaces
- Mapping weather station locations
- Getting StationID/StationCode values for other weather endpoints
Avoid when:
- You already know specific station IDs
- You need current weather conditions (prefer weather-information endpoints)
Inputs: none
Returns: array — one item per weather station
Output highlights:
- StationCode (numeric ID) and StationName for station identification
- Latitude and Longitude coordinates in decimal degrees for mapping
- StationCode is the key identifier used by other weather endpoints
- StationName may be null for some stations
- Foundational endpoint for discovering available weather monitoring locations
Chaining:
- get_weather_stations → extract StationCode → call weather-information endpoints with StationID
- get_weather_stations → extract StationCode → call searchWeatherInformation with StationID
- get_weather_stations → extract multiple StationCodes → call get_current_weather_for_stations with StationList

---

## get_cache_flush_date_fares

**Title:** Get Cache Flush Date Fares

Purpose: Get timestamp when WSF fares static data was last updated.
Use when:
- Determining when to refresh cached fare information
- Checking if fare data has changed since last fetch
- Coordinating cache invalidation across fare endpoints
Inputs: none
Returns: string — UTC timestamp in ISO format
Output highlights:
- ISO 8601 datetime string indicating last fares data update
- useful for cache invalidation and data freshness checks
Chaining:
- get_cache_flush_date_fares → compare with cached timestamp → invalidate cache if newer

---

## get_fares_valid_date_range

**Title:** Get Fares Valid Date Range

Purpose: Get date range when fares data is published and available.
Use when:
- Validating trip dates before fare queries
- Determining available booking periods
- Checking fare data coverage for specific dates
Inputs: none
Returns: object — fare data validity period
Output highlights:
- DateFrom: earliest UTC datetime when fares are available
- DateThru: latest UTC datetime when fares are available
- both dates in ISO 8601 format
- use to validate TripDate parameters in other endpoints
Chaining:
- get_fares_valid_date_range → validate TripDate → call fare endpoints with valid dates

---

## get_terminal_fares

**Title:** Get Terminal Fares

Purpose: List all valid departing terminals for a specific trip date.
Use when:
- Building departure terminal selection interfaces
- Discovering available ferry routes for a date
- Validating terminal IDs before fare queries
Avoid when:
- You only need one terminal (prefer get_terminal_mates_fares for terminal relationships)
Inputs:
- TripDate: YYYY-MM-DD format, from get_fares_valid_date_range
Returns: array — one item per departing terminal
Output highlights:
- TerminalID: numeric identifier for the terminal
- Description: human-readable terminal name
- includes all terminals with ferry service on the specified date
- use TerminalID for other fare and schedule endpoints
Chaining:
- get_fares_valid_date_range → validate TripDate → call get_terminal_fares
- get_terminal_fares → extract TerminalID → call get_terminal_mates_fares

---

## get_terminal_mates_fares

**Title:** Get Terminal Mates Fares

Purpose: List all valid arriving terminals for a specific departing terminal and trip date.
Use when:
- Discovering ferry routes from a specific departure terminal
- Building arrival terminal selection for a chosen departure
- Validating terminal pair combinations
Avoid when:
- You need all terminals (prefer get_terminal_fares for complete terminal list)
Inputs:
- TripDate: YYYY-MM-DD format
- TerminalID: from get_terminal_fares → TerminalID
Returns: array — one item per arriving terminal
Output highlights:
- TerminalID: numeric identifier for arriving terminals
- Description: human-readable terminal names
- only terminals reachable from the specified departing terminal
- use for building route selection interfaces
Chaining:
- get_terminal_fares → extract TerminalID → call get_terminal_mates_fares
- get_terminal_mates_fares → extract TerminalID → call fare calculation endpoints

---

## get_terminal_combo_fares

**Title:** Get Terminal Combo Fares

Purpose: Get fare collection procedures for a specific terminal pair and trip date.
Use when:
- Determining where and how fares are collected for a route
- Building fare payment instructions for users
- Understanding fare collection logistics for trip planning
Avoid when:
- You need all terminal combinations (prefer get_terminal_combo_fares_verbose)
Inputs:
- TripDate: YYYY-MM-DD format
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
Returns: object — fare collection information for one terminal pair
Output highlights:
- DepartingDescription: name of departure terminal
- ArrivingDescription: name of arrival terminal
- CollectionDescription: detailed text about fare collection procedures
- describes which terminals collect fares and payment requirements
Chaining:
- get_terminal_mates_fares → extract ArrivingTerminalID → call get_terminal_combo_fares
- get_terminal_combo_fares → display collection procedures to user

---

## get_terminal_combo_fares_verbose

**Title:** Get Terminal Combo Fares Verbose

Purpose: Get fare collection procedures for all terminal pairs on a specific trip date.
Use when:
- Building comprehensive fare collection reference for all routes
- Analyzing fare collection patterns across terminal network
- Creating fare payment guides for multiple destinations
Avoid when:
- You only need one terminal pair (prefer get_terminal_combo_fares)
Inputs:
- TripDate: YYYY-MM-DD format, from get_fares_valid_date_range
Returns: array — one item per terminal combination
Output highlights:
- DepartingTerminalID: numeric ID of departure terminal
- DepartingDescription: name of departure terminal
- ArrivingTerminalID: numeric ID of arrival terminal
- ArrivingDescription: name of arrival terminal
- CollectionDescription: fare collection procedures for each pair
- includes all valid terminal combinations for the date
Chaining:
- get_fares_valid_date_range → validate TripDate → call get_terminal_combo_fares_verbose
- get_terminal_combo_fares_verbose → filter by specific terminals → display collection info

---

## get_fare_line_items_basic

**Title:** Get Fare Line Items Basic

Purpose: List individual fare components for a specific terminal pair and trip type.
Use when:
- Building fare selection interfaces with passenger/vehicle options
- Calculating custom fares based on demographics and vehicle types
- Understanding available fare categories for a route
Avoid when:
- You need fare totals (prefer get_fare_totals_by_trip_date_and_route)
- You need all terminal combinations (prefer get_fare_line_items_verbose)
Inputs:
- TripDate: YYYY-MM-DD format
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
- RoundTrip: boolean, from terminal endpoints
Returns: array — one item per fare component
Output highlights:
- FareLineItemID: numeric identifier for the fare component
- FareLineItem: human-readable fare description
- Category: grouping like 'Passenger' or 'Vehicle'
- DirectionIndependent: whether fare is same in both directions
- Amount: cost in dollars for this fare component
Chaining:
- get_terminal_mates_fares → extract ArrivingTerminalID → call get_fare_line_items_basic
- get_fare_line_items_basic → extract FareLineItemID → call get_fare_totals_by_trip_date_and_route

---

## get_fare_line_items_verbose

**Title:** Get Fare Line Items Verbose

Purpose: Get complete fare line item data for all terminal combinations on a trip date.
Use when:
- Building comprehensive fare reference for all routes
- Analyzing fare structures across the entire terminal network
- Creating fare calculation engines for multiple destinations
Avoid when:
- You only need fares for one route (prefer get_fare_line_items_basic or get_fare_line_items_by_trip_date_and_terminals)
Inputs:
- TripDate: YYYY-MM-DD format, from get_fares_valid_date_range
Returns: object — comprehensive fare data for all terminal pairs
Output highlights:
- TerminalComboVerbose: array of all terminal combinations with collection info
- LineItemLookup: cross-reference mappings between terminals and fare arrays
- LineItems: one-way fare component arrays for each terminal pair
- RoundTripLineItems: round-trip fare component arrays for each terminal pair
- large payload containing all fare structures for the date
Chaining:
- get_fares_valid_date_range → validate TripDate → call get_fare_line_items_verbose
- get_fare_line_items_verbose → lookup fares by terminal indices → calculate custom totals

---

## get_fare_line_items_by_trip_date_and_terminals

**Title:** Get Fare Line Items By Trip Date And Terminals

Purpose: List complete fare components for a specific terminal pair and trip type.
Use when:
- Getting all available fare options for a route (not just popular ones)
- Building detailed fare selection with all passenger/vehicle categories
- Analyzing complete fare structures for specific journeys
Avoid when:
- You need fare totals (prefer get_fare_totals_by_trip_date_and_route)
- You need all terminal combinations (prefer get_fare_line_items_verbose)
Inputs:
- TripDate: YYYY-MM-DD format
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
- RoundTrip: boolean, from terminal endpoints
Returns: array — one item per fare component
Output highlights:
- FareLineItemID: numeric identifier for the fare component
- FareLineItem: human-readable fare description
- Category: grouping like 'Passenger' or 'Vehicle'
- DirectionIndependent: whether fare is same in both directions
- Amount: cost in dollars for this fare component
- includes all fare types available for the specific route
Chaining:
- get_terminal_mates_fares → extract ArrivingTerminalID → call get_fare_line_items_by_trip_date_and_terminals
- get_fare_line_items_by_trip_date_and_terminals → extract FareLineItemID → call get_fare_totals_by_trip_date_and_route

---

## get_fare_totals_by_trip_date_and_route

**Title:** Get Fare Totals By Trip Date And Route

Purpose: Calculate total fare costs for selected line items and quantities on a specific route.
Use when:
- Computing final prices for ferry tickets with specific passenger/vehicle combinations
- Generating fare quotes based on user selections
- Processing payment amounts for booking systems
Avoid when:
- You need individual fare components (prefer get_fare_line_items_basic or get_fare_line_items_by_trip_date_and_terminals)
Inputs:
- TripDate: YYYY-MM-DD format
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
- RoundTrip: boolean
- FareLineItemID: comma-separated IDs
- Quantity: comma-separated numbers matching FareLineItemID order
Returns: array — fare total breakdowns
Output highlights:
- TotalType: 1=Departing, 2=Return, 3=Either (direction independent), 4=Grand Total
- Description: human-readable total description
- BriefDescription: short form like 'Depart', 'Either', 'Total'
- Amount: calculated total cost in dollars
- multiple totals showing departing, return, and grand totals
Chaining:
- get_fare_line_items_basic → extract FareLineItemID → call get_fare_totals_by_trip_date_and_route
- get_fare_totals_by_trip_date_and_route → display total amounts to user

---

## get_active_seasons

**Title:** Get Active Seasons

Purpose: List all currently active schedule seasons with their effective date ranges and PDF URLs.
Use when:
- Discovering available schedule seasons
- Finding current season information
- Accessing schedule PDF documents
Inputs: none
Returns: array — one item per active schedule season
Output highlights:
- IDs: ScheduleID (unique numeric identifier)
- Names: ScheduleName (human-readable season name)
- Season codes: ScheduleSeason (0=Spring, 1=Summer, 2=Fall, 3=Winter)
- PDF access: SchedulePDFUrl (link to printable schedule document)
- Date ranges: ScheduleStart, ScheduleEnd (UTC timestamps for season validity)

---

## get_sailings_by_route_id

**Title:** Get Sailings By Route Id

Purpose: List active sailing schedule data for a scheduled route with complete journey and vessel information.
Use when:
- Accessing current sailing schedules for planning
- Building route-specific schedule displays
- Getting vessel assignments and terminal sequences
Avoid when:
- You need inactive sailings too (prefer get_all_sailings_by_sched_route_id)
- You need today's real-time schedule (prefer get_schedule_today_by_route)
Inputs:
- SchedRouteID: from get_scheduled_routes → SchedRouteID
Returns: array — active sailings for scheduled route (large payload)
Output highlights:
- IDs: ScheduleID, SchedRouteID, RouteID, SailingID
- Sailing details: SailingDescription, SailingNotes, SailingDir (1=Westbound, 2=Eastbound)
- Operation: DayOpDescription, DayOpUseForHoliday, DisplayColNum
- Date ranges: ActiveDateRanges array with DateFrom, DateThru, EventID, EventDescription
- Journeys: Journs array with vessel assignments, terminal stops, departure/arrival times
- Vessel info: VesselID, VesselName, VesselHandicapAccessible in each journey
- Terminal sequence: TerminalID, TerminalName, Departing/Arriving times in each journey
Chaining:
- get_scheduled_routes → extract SchedRouteID → call get_sailings_by_route_id with { SchedRouteID: ... }
- get_routes_by_trip_date → extract RouteID → call get_sailings_by_route_id (may need SchedRouteID lookup)

---

## get_all_sailings_by_sched_route_id

**Title:** Get All Sailings By Sched Route Id

Purpose: List comprehensive sailing schedule data for a scheduled route, including inactive sailings and complete journey information.
Use when:
- Accessing complete sailing schedules for analysis
- Building schedule management interfaces
- Working with historical or inactive sailing data
Avoid when:
- You only need active sailings (prefer get_sailings_by_route_id)
- You need today's schedule (prefer get_schedule_today_by_route)
Inputs:
- SchedRouteID: from get_scheduled_routes → SchedRouteID
Returns: array — all sailings for scheduled route (large payload)
Output highlights:
- IDs: ScheduleID, SchedRouteID, RouteID, SailingID
- Sailing details: SailingDescription, SailingNotes, SailingDir (1=Westbound, 2=Eastbound)
- Operation: DayOpDescription, DayOpUseForHoliday, DisplayColNum
- Date ranges: ActiveDateRanges array with DateFrom, DateThru, EventID, EventDescription
- Journeys: Journs array with vessel assignments, terminal stops, departure/arrival times
- Vessel info: VesselID, VesselName, VesselHandicapAccessible in each journey
- Terminal sequence: TerminalID, TerminalName, Departing/Arriving times in each journey
Chaining:
- get_scheduled_routes → extract SchedRouteID → call get_all_sailings_by_sched_route_id with { SchedRouteID: ... }

---

## get_cache_flush_date_schedule

**Title:** Get Cache Flush Date Schedule

Purpose: Get the timestamp when static schedule data was last updated for cache invalidation.
Use when:
- Detecting when schedule data has changed
- Implementing cache invalidation strategies
- Optimizing data refresh timing
Inputs: none
Returns: string — UTC timestamp or null
Output highlights:
- Timestamp: UTC datetime string when static schedule data was last updated
- Null handling: returns null if no update has occurred

---

## get_route_details_by_trip_date

**Title:** Get Route Details By Trip Date

Purpose: List comprehensive route details for all routes operating on a specific trip date.
Use when:
- Discovering all available routes for a date
- Accessing route alerts and seasonal notes
- Planning multi-route travel
- Checking reservation and accessibility requirements
Avoid when:
- You only need basic route identification (prefer get_routes_by_trip_date)
- You need details for one specific route (prefer get_route_details_by_trip_date_and_route_id)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
Returns: array — one item per route operating on trip date
Output highlights:
- IDs: RouteID, RegionID, VesselWatchID
- Names: RouteAbbrev, Description
- Route characteristics: ReservationFlag, InternationalFlag, PassengerOnlyFlag
- Timing: CrossingTime (estimated minutes)
- Accessibility: AdaNotes (HTML accessibility information)
- Information: GeneralRouteNotes, SeasonalRouteNotes (HTML-formatted route info)
- Alerts: Alerts array with BulletinID, AlertDescription, AlertFullText (HTML), PublishDate
- Large text fields: AdaNotes, GeneralRouteNotes, SeasonalRouteNotes, AlertFullText may be lengthy HTML

---

## get_route_details_by_trip_date_and_terminals

**Title:** Get Route Details By Trip Date And Terminals

Purpose: Get detailed route information for routes connecting specific departing and arriving terminals on a trip date.
Use when:
- Planning travel between known terminals
- Checking route options for a specific terminal pair
- Getting alerts and notes for terminal-to-terminal routes
Avoid when:
- You need routes for all terminals (prefer get_route_details_by_trip_date)
- You don't know terminal IDs (prefer get_terminals_and_mates first)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
Returns: array — routes connecting the terminal pair (typically 1 item)
Output highlights:
- IDs: RouteID, RegionID, VesselWatchID
- Names: RouteAbbrev, Description
- Route characteristics: ReservationFlag, InternationalFlag, PassengerOnlyFlag
- Timing: CrossingTime (estimated minutes)
- Accessibility: AdaNotes (HTML accessibility information)
- Information: GeneralRouteNotes, SeasonalRouteNotes (HTML-formatted route info)
- Alerts: Alerts array with BulletinID, AlertDescription, AlertFullText (HTML), PublishDate
- Large text fields: AdaNotes, GeneralRouteNotes, SeasonalRouteNotes, AlertFullText may be lengthy HTML
Chaining:
- get_terminals_and_mates → extract DepartingTerminalID, ArrivingTerminalID → call get_route_details_by_trip_date_and_terminals with { DepartingTerminalID: ..., ArrivingTerminalID: ..., TripDate: ... }

---

## get_route_details_by_trip_date_and_route_id

**Title:** Get Route Details By Trip Date And Route Id

Purpose: Get comprehensive route details for a specific route on a specific trip date.
Use when:
- Accessing detailed information for one route
- Checking route-specific alerts and accessibility
- Getting reservation requirements for a specific route
Avoid when:
- You need details for multiple routes (prefer get_route_details_by_trip_date)
- You don't know the RouteID (prefer get_route_details_by_trip_date then filter)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- RouteID: from get_routes_by_trip_date → RouteID
Returns: object — detailed information for single route
Output highlights:
- IDs: RouteID, RegionID, VesselWatchID
- Names: RouteAbbrev, Description
- Route characteristics: ReservationFlag, InternationalFlag, PassengerOnlyFlag
- Timing: CrossingTime (estimated minutes)
- Accessibility: AdaNotes (HTML accessibility information)
- Information: GeneralRouteNotes, SeasonalRouteNotes (HTML-formatted route info)
- Alerts: Alerts array with BulletinID, AlertDescription, AlertFullText (HTML), PublishDate
- Large text fields: AdaNotes, GeneralRouteNotes, SeasonalRouteNotes, AlertFullText may be lengthy HTML
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_route_details_by_trip_date_and_route_id with { RouteID: ..., TripDate: ... }
- get_route_details_by_trip_date → extract RouteID → call get_route_details_by_trip_date_and_route_id with { RouteID: ..., TripDate: ... }

---

## get_routes_by_trip_date

**Title:** Get Routes By Trip Date

Purpose: List basic route identification and service disruption information for all routes operating on a specific trip date.
Use when:
- Discovering available RouteIDs for a date
- Building route selection interfaces
- Checking for service disruptions across all routes
Avoid when:
- You need detailed route information (prefer get_route_details_by_trip_date)
- You need routes for specific terminals (prefer get_routes_by_trip_date_and_terminals)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
Returns: array — one item per route operating on trip date
Output highlights:
- IDs: RouteID, RegionID
- Names: RouteAbbrev, Description
- Service status: ServiceDisruptions array with BulletinID, BulletinFlag, PublishDate, DisruptionDescription
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_route_details_by_trip_date_and_route_id with { RouteID: ..., TripDate: ... }
- get_routes_by_trip_date → extract RouteID → call get_sailings_by_route_id with { RouteID: ... }

---

## get_routes_by_trip_date_and_terminals

**Title:** Get Routes By Trip Date And Terminals

Purpose: List basic route information for routes connecting specific departing and arriving terminals on a trip date.
Use when:
- Finding route options between known terminals
- Getting RouteID for terminal-to-terminal travel
- Checking service disruptions for specific routes
Avoid when:
- You need all routes for a date (prefer get_routes_by_trip_date)
- You need detailed route information (prefer get_route_details_by_trip_date_and_terminals)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
Returns: array — routes connecting the terminal pair (typically 1 item)
Output highlights:
- IDs: RouteID, RegionID
- Names: RouteAbbrev, Description
- Service status: ServiceDisruptions array with BulletinID, BulletinFlag, PublishDate, DisruptionDescription
Chaining:
- get_terminals_and_mates → extract DepartingTerminalID, ArrivingTerminalID → call get_routes_by_trip_date_and_terminals with { DepartingTerminalID: ..., ArrivingTerminalID: ..., TripDate: ... }
- get_routes_by_trip_date_and_terminals → extract RouteID → call get_route_details_by_trip_date_and_terminals with { RouteID: ..., TripDate: ..., DepartingTerminalID: ..., ArrivingTerminalID: ... }

---

## get_routes_having_service_disruptions_by_trip_date

**Title:** Get Routes Having Service Disruptions By Trip Date

Purpose: List all service disruptions affecting routes on a specific trip date.
Use when:
- Checking for disruptions before planning travel
- Monitoring service reliability for a date
- Getting disruption details for planning alternatives
Avoid when:
- You need disruptions for all dates (prefer get_schedule_alerts)
- You need disruptions for specific routes (check ServiceDisruptions in route endpoints)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
Returns: array — service disruptions for the trip date (may be empty)
Output highlights:
- Disruption details: BulletinID, BulletinFlag, PublishDate, DisruptionDescription
- Note: Results may be empty when no disruptions exist for the date

---

## get_schedule_alerts

**Title:** Get Schedule Alerts

Purpose: List all current schedule alerts with detailed text in multiple formats for different display contexts.
Use when:
- Monitoring system-wide alerts and disruptions
- Building alert displays for multiple routes
- Accessing alerts in different formats (bulletin, homepage, IVR)
Inputs: none
Returns: array — all current schedule alerts
Output highlights:
- IDs: BulletinID, AlertTypeID
- Alert types: AlertType, BulletinFlag, CommunicationFlag, RouteAlertFlag
- Text formats: BulletinText (HTML), RouteAlertText (compact), HomepageAlertText (HTML), IVRText
- Timing: PublishDate (UTC)
- Scope: AllRoutesFlag, AffectedRouteIDs array
- Metadata: AlertFullTitle, DisruptionDescription, SortSeq for display ordering

---

## get_schedule_by_trip_date_and_route_id

**Title:** Get Schedule By Trip Date And Route Id

Purpose: Get complete sailing schedule for all terminal combinations on a specific route for a trip date, accounting for contingencies and time adjustments.
Use when:
- Getting the full schedule for an entire route
- Planning complex multi-terminal travel on a route
- Checking all departure options for a route
Avoid when:
- You need schedule for specific terminals (prefer get_schedule_by_trip_date_and_terminal_ids)
- You need real-time schedule (prefer get_schedule_today_by_route)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- RouteID: from get_routes_by_trip_date → RouteID
Returns: object — complete schedule for route with all terminal combinations
Output highlights:
- Schedule info: ScheduleID, ScheduleName, ScheduleSeason, SchedulePDFUrl, ScheduleStart/End dates
- Route coverage: AllRoutes array of RouteIDs
- Terminal combinations: TerminalCombos array with all departure/arrival pairs for the route
- Departure times: Times array per terminal combo with DepartingTime, ArrivingTime, LoadingRule (1=Passenger, 2=Vehicle, 3=Both)
- Vessel assignments: VesselID, VesselName, VesselHandicapAccessible, VesselPositionNum
- Additional info: SailingNotes, Annotations, AnnotationIndexes for special conditions
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_schedule_by_trip_date_and_route_id with { RouteID: ..., TripDate: ... }

---

## get_schedule_by_trip_date_and_terminal_ids

**Title:** Get Schedule By Trip Date And Terminal Ids

Purpose: Get complete sailing schedule for a specific terminal pair on a trip date, accounting for contingencies and time adjustments.
Use when:
- Planning travel between known terminals on a specific date
- Getting scheduled departure times with all adjustments applied
- Checking terminal-to-terminal sailing availability
Avoid when:
- You need real-time schedule with current vessel assignments (prefer get_schedule_today_by_terminals)
- You don't know terminal IDs (prefer get_terminals_and_mates first)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
Returns: object — complete schedule for terminal pair with all adjustments
Output highlights:
- Schedule info: ScheduleID, ScheduleName, ScheduleSeason, SchedulePDFUrl, ScheduleStart/End dates
- Route coverage: AllRoutes array of RouteIDs
- Terminal combination: Single TerminalCombos entry with DepartingTerminalID/Name, ArrivingTerminalID/Name
- Departure times: Times array with DepartingTime, ArrivingTime, LoadingRule (1=Passenger, 2=Vehicle, 3=Both)
- Vessel assignments: VesselID, VesselName, VesselHandicapAccessible, VesselPositionNum
- Additional info: SailingNotes, Annotations, AnnotationIndexes for special conditions
Chaining:
- get_terminals_and_mates → extract DepartingTerminalID, ArrivingTerminalID → call get_schedule_by_trip_date_and_terminal_ids with { DepartingTerminalID: ..., ArrivingTerminalID: ..., TripDate: ... }

---

## get_scheduled_routes

**Title:** Get Scheduled Routes

Purpose: List all scheduled routes across current and upcoming schedule seasons with route details and contingency information.
Use when:
- Discovering available scheduled routes for planning
- Getting route IDs for schedule queries
- Checking contingency routes and seasonal notes
Avoid when:
- You need routes for a specific season (use ScheduleID parameter)
- You need detailed route information (prefer get_route_details_by_trip_date)
Inputs:
- ScheduleID: optional, from get_active_seasons → ScheduleID to filter by season; omit for all seasons
Returns: array — all scheduled routes across seasons
Output highlights:
- IDs: ScheduleID, SchedRouteID, RouteID, RegionID
- Route info: RouteAbbrev, Description, SeasonalRouteNotes (HTML)
- Contingency: ContingencyOnly flag, ContingencyAdj array with DateFrom/Thru, EventID, AdjType (1=Addition, 2=Cancellation)
- Service status: ServiceDisruptions array with BulletinID, BulletinFlag, PublishDate, DisruptionDescription

---

## get_scheduled_routes_by_id

**Title:** Get Scheduled Routes By Id

Purpose: List scheduled routes for a specific schedule season with route details and contingency information.
Use when:
- Getting routes for a specific season
- Season-specific route planning
- Checking which routes are active in a particular schedule
Avoid when:
- You need routes across all seasons (prefer get_scheduled_routes)
- You don't know the ScheduleID (prefer get_active_seasons first)
Inputs:
- ScheduleID: required, from get_active_seasons → ScheduleID
Returns: array — scheduled routes for the specified season
Output highlights:
- IDs: ScheduleID, SchedRouteID, RouteID, RegionID
- Route info: RouteAbbrev, Description, SeasonalRouteNotes (HTML)
- Contingency: ContingencyOnly flag, ContingencyAdj array with DateFrom/Thru, EventID, AdjType (1=Addition, 2=Cancellation)
- Service status: ServiceDisruptions array with BulletinID, BulletinFlag, PublishDate, DisruptionDescription
Chaining:
- get_active_seasons → extract ScheduleID → call get_scheduled_routes_by_id with { ScheduleID: ... }

---

## get_schedule_today_by_route

**Title:** Get Schedule Today By Route

Purpose: Get today's complete sailing schedule for a specific route with real-time vessel assignments and departure times.
Use when:
- Planning today's travel on a specific route
- Checking current vessel assignments
- Getting real-time schedule information with filtering options
Avoid when:
- You need schedule data for multiple routes (prefer bulk endpoints)
- You need historical schedule data (prefer sailing endpoints)
Inputs:
- RouteID: from get_routes_by_trip_date → RouteID
- OnlyRemainingTimes: true for future departures only, false for all today's departures
Returns: object — today's complete schedule for the route
Output highlights:
- Schedule info: ScheduleID, ScheduleName, ScheduleSeason, SchedulePDFUrl, ScheduleStart/End dates
- Route coverage: AllRoutes array of RouteIDs covered by this schedule
- Terminal combinations: TerminalCombos array with DepartingTerminalID/Name, ArrivingTerminalID/Name
- Departure times: Times array with DepartingTime, ArrivingTime, LoadingRule (1=Passenger, 2=Vehicle, 3=Both)
- Vessel assignments: VesselID, VesselName, VesselHandicapAccessible, VesselPositionNum
- Additional info: SailingNotes, Annotations, AnnotationIndexes for special conditions
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_schedule_today_by_route with { RouteID: ..., OnlyRemainingTimes: true }

---

## get_schedule_today_by_terminals

**Title:** Get Schedule Today By Terminals

Purpose: Get today's sailing schedule for a specific terminal pair with real-time vessel assignments and departure times.
Use when:
- Planning today's travel between known terminals
- Checking schedules for specific departure/arrival locations
- Getting focused schedule data for a terminal pair
Avoid when:
- You need schedules for multiple terminal pairs (prefer get_schedule_today_by_route)
- You don't know terminal IDs (prefer get_terminals_and_mates first)
Inputs:
- DepartingTerminalID: from get_terminals_and_mates → TerminalID
- ArrivingTerminalID: from get_terminals_and_mates → TerminalID
- OnlyRemainingTimes: true for future departures only, false for all today's departures
Returns: object — today's schedule for the terminal pair
Output highlights:
- Schedule info: ScheduleID, ScheduleName, ScheduleSeason, SchedulePDFUrl, ScheduleStart/End dates
- Route coverage: AllRoutes array of RouteIDs for this terminal pair
- Terminal combination: Single TerminalCombos entry with DepartingTerminalID/Name, ArrivingTerminalID/Name
- Departure times: Times array with DepartingTime, ArrivingTime, LoadingRule (1=Passenger, 2=Vehicle, 3=Both)
- Vessel assignments: VesselID, VesselName, VesselHandicapAccessible, VesselPositionNum
- Additional info: SailingNotes, Annotations, AnnotationIndexes for special conditions
Chaining:
- get_terminals_and_mates → extract DepartingTerminalID, ArrivingTerminalID → call get_schedule_today_by_terminals with { DepartingTerminalID: ..., ArrivingTerminalID: ..., OnlyRemainingTimes: true }

---

## get_schedule_valid_date_range

**Title:** Get Schedule Valid Date Range

Purpose: Get the date range for which schedule data is currently published and available.
Use when:
- Validating trip dates before calling other schedule endpoints
- Determining available date ranges for planning
- Checking schedule data availability
Inputs: none
Returns: object — valid date range for schedule data
Output highlights:
- DateFrom: Earliest valid trip date (UTC datetime)
- DateThru: Latest valid trip date (UTC datetime)

---

## get_terminal_mates_schedule

**Title:** Get Terminal Mates Schedule

Purpose: List all valid arriving terminals that can be reached from a specific departing terminal on a trip date.
Use when:
- Discovering travel destinations from a starting terminal
- Building terminal selection interfaces
- Validating terminal-to-terminal routes
Avoid when:
- You need all terminals in the system (prefer get_terminals)
- You don't know the departing TerminalID (prefer get_terminals first)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- TerminalID: from get_terminals → TerminalID
Returns: array — valid arriving terminals for the departing terminal
Output highlights:
- Terminal info: TerminalID, Description (display name)
Chaining:
- get_terminals → extract TerminalID → call get_terminal_mates_schedule with { TerminalID: ..., TripDate: ... }

---

## get_terminals

**Title:** Get Terminals

Purpose: List all valid departing terminals available for ferry service on a specific trip date.
Use when:
- Discovering available departure terminals
- Building terminal selection interfaces
- Getting TerminalID values for other endpoints
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
Returns: array — valid departing terminals for the trip date
Output highlights:
- Terminal info: TerminalID, Description (display name)

---

## get_terminals_and_mates

**Title:** Get Terminals And Mates

Purpose: List all valid departing-arriving terminal combinations available for ferry service on a specific trip date.
Use when:
- Discovering all possible travel routes
- Building comprehensive route planning interfaces
- Validating terminal pair availability
Avoid when:
- You need terminals for a specific departure point (prefer get_terminal_mates_schedule)
- You only need departing terminals (prefer get_terminals)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
Returns: array — all valid terminal pairs for the trip date
Output highlights:
- Departing terminal: DepartingTerminalID, DepartingDescription
- Arriving terminal: ArrivingTerminalID, ArrivingDescription

---

## get_terminals_and_mates_by_route

**Title:** Get Terminals And Mates By Route

Purpose: List all valid departing-arriving terminal combinations available on a specific route for a trip date.
Use when:
- Getting terminal options for a specific route
- Planning travel along a particular ferry route
- Validating route-specific terminal availability
Avoid when:
- You need terminals for all routes (prefer get_terminals_and_mates)
- You don't know the RouteID (prefer get_routes_by_trip_date first)
Inputs:
- TripDate: YYYY-MM-DD format, from get_schedule_valid_date_range → valid date range
- RouteID: from get_routes_by_trip_date → RouteID
Returns: array — valid terminal pairs for the specified route
Output highlights:
- Departing terminal: DepartingTerminalID, DepartingDescription
- Arriving terminal: ArrivingTerminalID, ArrivingDescription
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_terminals_and_mates_by_route with { RouteID: ..., TripDate: ... }

---

## get_time_adjustments

**Title:** Get Time Adjustments

Purpose: List all schedule time adjustments and cancellations across all routes and scheduled routes.
Use when:
- Monitoring all schedule deviations system-wide
- Checking for tidal adjustments and event-related changes
- Building comprehensive schedule adjustment tracking
Avoid when:
- You need adjustments for a specific route (prefer get_time_adjustments_by_route)
- You need adjustments for a specific scheduled route (prefer get_time_adjustments_by_sched_route)
Inputs: none
Returns: array — all time adjustments across all routes (large payload)
Output highlights:
- Schedule/route info: ScheduleID, SchedRouteID, RouteID, RouteDescription
- Sailing details: SailingID, SailingDescription, SailingDir (1=Westbound, 2=Eastbound)
- Time adjustment: TimeToAdj (original time), AdjDateFrom/AdjDateThru (adjustment period)
- Adjustment type: AdjType (1=Addition, 2=Cancellation), TidalAdj (tidal-related), DepArrIndicator (1=Departure, 2=Arrival)
- Vessel/terminal: VesselID, VesselName, TerminalID, TerminalDescription
- Events: EventID, EventDescription (reason for adjustment)
- Annotations: Additional context and notes for the adjustment

---

## get_time_adjustments_by_route

**Title:** Get Time Adjustments By Route

Purpose: List schedule time adjustments and cancellations for a specific route.
Use when:
- Checking schedule deviations for a particular route
- Monitoring tidal adjustments affecting specific routes
- Getting route-specific schedule changes
Avoid when:
- You need adjustments for all routes (prefer get_time_adjustments)
- You need adjustments for a scheduled route (prefer get_time_adjustments_by_sched_route)
Inputs:
- RouteID: from get_routes_by_trip_date → RouteID
Returns: array — time adjustments for the specified route (may be empty)
Output highlights:
- Schedule/route info: ScheduleID, SchedRouteID, RouteID, RouteDescription
- Sailing details: SailingID, SailingDescription, SailingDir (1=Westbound, 2=Eastbound)
- Time adjustment: TimeToAdj (original time), AdjDateFrom/AdjDateThru (adjustment period)
- Adjustment type: AdjType (1=Addition, 2=Cancellation), TidalAdj (tidal-related), DepArrIndicator (1=Departure, 2=Arrival)
- Vessel/terminal: VesselID, VesselName, TerminalID, TerminalDescription
- Events: EventID, EventDescription (reason for adjustment)
- Annotations: Additional context and notes for the adjustment
Chaining:
- get_routes_by_trip_date → extract RouteID → call get_time_adjustments_by_route with { RouteID: ... }

---

## get_time_adjustments_by_sched_route

**Title:** Get Time Adjustments By Sched Route

Purpose: List schedule time adjustments and cancellations for a specific scheduled route.
Use when:
- Checking schedule deviations for a particular scheduled route
- Monitoring adjustments affecting specific scheduled routes
- Getting scheduled route-specific schedule changes
Avoid when:
- You need adjustments for all scheduled routes (prefer get_time_adjustments)
- You need adjustments for a route (prefer get_time_adjustments_by_route)
Inputs:
- SchedRouteID: from get_scheduled_routes → SchedRouteID
Returns: array — time adjustments for the specified scheduled route (may be empty)
Output highlights:
- Schedule/route info: ScheduleID, SchedRouteID, RouteID, RouteDescription
- Sailing details: SailingID, SailingDescription, SailingDir (1=Westbound, 2=Eastbound)
- Time adjustment: TimeToAdj (original time), AdjDateFrom/AdjDateThru (adjustment period)
- Adjustment type: AdjType (1=Addition, 2=Cancellation), TidalAdj (tidal-related), DepArrIndicator (1=Departure, 2=Arrival)
- Vessel/terminal: VesselID, VesselName, TerminalID, TerminalDescription
- Events: EventID, EventDescription (reason for adjustment)
- Annotations: Additional context and notes for the adjustment
Chaining:
- get_scheduled_routes → extract SchedRouteID → call get_time_adjustments_by_sched_route with { SchedRouteID: ... }

---

## get_cache_flush_date_terminals

**Title:** Get Cache Flush Date Terminals

Purpose: Get timestamp indicating when static terminal data was last updated for cache invalidation.
Use when:
- Detecting when terminal data has changed
- Implementing cache invalidation strategies
- Polling for terminal data updates
Inputs: none
Returns: string — UTC timestamp when terminal data was last updated
Output highlights:
- Timestamp in ISO 8601 format indicating last update time
- Returns undefined if no update has occurred
- Used to determine when cached terminal information should be refreshed
Chaining:
- get_cache_flush_date_terminals → compare with cached timestamp → call terminal bulk endpoints if changed

---

## get_terminal_basics

**Title:** Get Terminal Basics

Purpose: List basic identification and amenity information for all terminals in the WSF system.
Use when:
- Discovering TerminalID values for specific terminals
- Building terminal selection interfaces
- Getting overview of terminal locations and basic facilities
Avoid when:
- You only need one terminal (prefer get_terminal_basics_by_terminal_id)
- You need detailed terminal information (prefer get_terminal_verbose or get_terminal_verbose_by_terminal_id)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- IDs: TerminalID (primary key), TerminalSubjectID, RegionID
- Names: TerminalName, TerminalAbbrev
- Display: SortSeq (ordering for UI lists)
- Amenities: OverheadPassengerLoading, Elevator, WaitingRoom, FoodService, Restroom (boolean flags)
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_verbose_by_terminal_id / get_terminal_locations_by_terminal_id / get_terminal_bulletins_by_terminal_id

---

## get_terminal_basics_by_terminal_id

**Title:** Get Terminal Basics By Terminal Id

Purpose: Get basic identification and amenity information for a single terminal by its TerminalID.
Use when:
- Enriching a terminal picker with basic details
- Getting terminal info when you already know the TerminalID
- Minimizing payload size for single terminal queries
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need detailed terminal information (prefer get_terminal_verbose_by_terminal_id)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal profile
Output highlights:
- IDs: TerminalID (primary key), TerminalSubjectID, RegionID
- Names: TerminalName, TerminalAbbrev
- Display: SortSeq (ordering for UI lists)
- Amenities: OverheadPassengerLoading, Elevator, WaitingRoom, FoodService, Restroom (boolean flags)
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_basics_by_terminal_id (for single terminal details)

---

## get_terminal_bulletins

**Title:** Get Terminal Bulletins

Purpose: List alerts, announcements, and service bulletins for all terminals in the WSF system.
Use when:
- Checking for terminal-specific alerts and announcements
- Building notification systems for terminal updates
- Getting comprehensive bulletin overview across all terminals
Avoid when:
- You only need bulletins for one terminal (prefer get_terminal_bulletins_by_terminal_id)
- You're not interested in bulletin content (prefer lighter endpoints)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Bulletins array: contains zero or more bulletin objects per terminal
- Bulletin content: BulletinTitle, BulletinText (HTML-formatted, can be lengthy), BulletinSortSeq
- Bulletin metadata: BulletinLastUpdated (timestamp), BulletinLastUpdatedSortable (legacy format)
- Large text: BulletinText contains HTML content that can be substantial
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_bulletins_by_terminal_id (for single terminal bulletins)

---

## get_terminal_bulletins_by_terminal_id

**Title:** Get Terminal Bulletins By Terminal Id

Purpose: Get alerts, announcements, and service bulletins for a single terminal by its TerminalID.
Use when:
- Checking for alerts at a specific terminal you're interested in
- Enriching terminal details with current bulletins
- Minimizing payload when you only need one terminal's bulletins
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need bulletins for multiple terminals (prefer get_terminal_bulletins)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal with its bulletins
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Bulletins array: zero or more bulletin objects for this terminal
- Bulletin content: BulletinTitle, BulletinText (HTML-formatted), BulletinSortSeq
- Bulletin metadata: BulletinLastUpdated (timestamp), BulletinLastUpdatedSortable
- Large text: BulletinText contains HTML content that can be substantial
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_bulletins_by_terminal_id

---

## get_terminal_locations

**Title:** Get Terminal Locations

Purpose: List detailed geographical and address information for all terminals in the WSF system.
Use when:
- Building maps or location-based interfaces
- Getting terminal coordinates for geolocation features
- Needing complete address and directions for all terminals
Avoid when:
- You only need one terminal's location (prefer get_terminal_locations_by_terminal_id)
- You don't need detailed location data (prefer lighter endpoints)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Coordinates: Latitude, Longitude in decimal degrees
- Address: AddressLineOne, AddressLineTwo, City, State, ZipCode, Country
- Navigation: MapLink (Google Maps URL), Directions (HTML-formatted driving directions)
- GIS data: DispGISZoomLoc array with coordinates for different map zoom levels (can be lengthy)
- Large text: Directions contains substantial HTML content with detailed instructions
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_locations_by_terminal_id (for single terminal location)

---

## get_terminal_locations_by_terminal_id

**Title:** Get Terminal Locations By Terminal Id

Purpose: Get detailed geographical and address information for a single terminal by its TerminalID.
Use when:
- Getting coordinates and directions for a specific terminal
- Enriching terminal details with location data
- Minimizing payload when you only need one terminal's location
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need locations for multiple terminals (prefer get_terminal_locations)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal with detailed location data
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Coordinates: Latitude, Longitude in decimal degrees
- Address: AddressLineOne, AddressLineTwo, City, State, ZipCode, Country
- Navigation: MapLink (map URL), Directions (HTML-formatted driving directions)
- GIS data: DispGISZoomLoc array with coordinates for different map zoom levels
- Large text: Directions contains substantial HTML content with detailed instructions
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_locations_by_terminal_id

---

## get_terminal_sailing_space

**Title:** Get Terminal Sailing Space

Purpose: List real-time vehicle space availability for upcoming departures from all terminals in the WSF system.
Use when:
- Checking current vehicle capacity and reservations for all terminals
- Building real-time space availability dashboards
- Getting comprehensive sailing space overview across all terminals
Avoid when:
- You only need space info for one terminal (prefer get_terminal_sailing_space_by_terminal_id)
- You need static terminal data (prefer other terminal endpoints)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- DepartingSpaces array: upcoming departures with vessel and space details (can be lengthy)
- Departure info: Departure (datetime), IsCancelled, VesselID, VesselName, MaxSpaceCount
- SpaceForArrivalTerminals: nested array with space counts for each destination
- Space counts: ReservableSpaceCount, DriveUpSpaceCount with hex color indicators
- Fare collection: IsNoFareCollected, NoFareCollectedMsg flags
- Large payload: real-time data changes frequently, contains nested arrays of departures/destinations
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_sailing_space_by_terminal_id (for single terminal space info)

---

## get_terminal_sailing_space_by_terminal_id

**Title:** Get Terminal Sailing Space By Terminal Id

Purpose: Get real-time vehicle space availability for upcoming departures from a single terminal by its TerminalID.
Use when:
- Checking space availability for a specific terminal you're departing from
- Getting real-time capacity info for a terminal you know by ID
- Minimizing payload when you only need one terminal's sailing space
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need space info for multiple terminals (prefer get_terminal_sailing_space)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal with sailing space data
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- DepartingSpaces array: upcoming departures with vessel and space details
- Departure info: Departure (datetime), IsCancelled, VesselID, VesselName, MaxSpaceCount
- SpaceForArrivalTerminals: nested array with space counts for each destination
- Space counts: ReservableSpaceCount, DriveUpSpaceCount with hex color indicators
- Fare collection: IsNoFareCollected, NoFareCollectedMsg flags
- Real-time data: changes frequently, contains nested arrays of departures/destinations
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_sailing_space_by_terminal_id

---

## get_terminal_transports

**Title:** Get Terminal Transports

Purpose: List comprehensive transportation and commuter information for all terminals in the WSF system.
Use when:
- Getting parking details and rates for all terminals
- Finding airport shuttle and transit connection information
- Accessing vehicle-specific travel tips (motorcycles, trucks, bikes, HOV)
Avoid when:
- You only need transport info for one terminal (prefer get_terminal_transports_by_terminal_id)
- You don't need detailed commuter information (prefer lighter endpoints)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Parking: ParkingInfo (HTML rates/details), ParkingShuttleInfo (shuttle services)
- Airport: AirportInfo (directions), AirportShuttleInfo (shuttle services)
- Vehicle tips: MotorcycleInfo, TruckInfo, BikeInfo (HTML-formatted travel tips)
- Transit: TrainInfo, TaxiInfo, HovInfo (carpool/vanpool details)
- TransitLinks array: transit agency URLs and names for public transportation
- Large text: extensive HTML content for parking rates, directions, and vehicle tips
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_transports_by_terminal_id (for single terminal transport info)

---

## get_terminal_transports_by_terminal_id

**Title:** Get Terminal Transports By Terminal Id

Purpose: Get comprehensive transportation and commuter information for a single terminal by its TerminalID.
Use when:
- Getting detailed parking rates and directions for a specific terminal
- Finding airport shuttle and transit connections for your destination
- Accessing vehicle-specific travel tips for a particular terminal
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need transport info for multiple terminals (prefer get_terminal_transports)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal with detailed transport info
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- Parking: ParkingInfo (HTML rates/details), ParkingShuttleInfo (shuttle services)
- Airport: AirportInfo (directions), AirportShuttleInfo (shuttle services)
- Vehicle tips: MotorcycleInfo, TruckInfo, BikeInfo (HTML-formatted travel tips)
- Transit: TrainInfo, TaxiInfo, HovInfo (carpool/vanpool details)
- TransitLinks array: transit agency URLs and names for public transportation
- Large text: extensive HTML content for parking rates, directions, and vehicle tips
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_transports_by_terminal_id

---

## get_terminal_verbose

**Title:** Get Terminal Verbose

Purpose: List complete terminal profiles combining all available data for all terminals in the WSF system.
Use when:
- Building offline applications needing all terminal data
- One-time bulk export of complete terminal information
- Debugging or data analysis requiring full terminal datasets
Avoid when:
- You only need one terminal (prefer get_terminal_verbose_by_terminal_id)
- You only need specific data types (prefer targeted endpoints like get_terminal_basics or get_terminal_locations)
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Combines ALL terminal data: basics + bulletins + locations + sailing space + transports + wait times
- IDs: TerminalID, TerminalSubjectID, RegionID
- Names: TerminalName, TerminalAbbrev, SortSeq
- Amenities: OverheadPassengerLoading, Elevator, WaitingRoom, FoodService, Restroom
- Bulletins: full bulletins array with HTML content and metadata
- Location: coordinates, full address, map links, directions, GIS zoom levels
- Sailing space: real-time departure schedules with vehicle capacity and availability
- Transportation: parking, airport shuttles, vehicle tips, transit links (extensive HTML)
- Wait times: current passenger wait time estimates
- Massive payload: contains all terminal data combined, extremely large response
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_verbose_by_terminal_id (preferred for single terminal)

---

## get_terminal_verbose_by_terminal_id

**Title:** Get Terminal Verbose By Terminal Id

Purpose: Get complete terminal profile combining all available data for a single terminal by its TerminalID.
Use when:
- Building detailed terminal pages with all available information
- Enriching terminal data when you need everything for one location
- Minimizing requests when you need multiple data types for the same terminal
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You only need specific data types (prefer targeted endpoints like get_terminal_locations_by_terminal_id)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one complete terminal profile
Output highlights:
- Combines ALL terminal data: basics + bulletins + locations + sailing space + transports + wait times
- IDs: TerminalID, TerminalSubjectID, RegionID
- Names: TerminalName, TerminalAbbrev, SortSeq
- Amenities: OverheadPassengerLoading, Elevator, WaitingRoom, FoodService, Restroom
- Bulletins: full bulletins array with HTML content and metadata
- Location: coordinates, full address, map links, directions, GIS zoom levels
- Sailing space: real-time departure schedules with vehicle capacity and availability
- Transportation: parking, airport shuttles, vehicle tips, transit links (extensive HTML)
- Wait times: current passenger wait time estimates
- Large payload: contains all data for one terminal, but still substantial
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_verbose_by_terminal_id

---

## get_terminal_wait_times

**Title:** Get Terminal Wait Times

Purpose: List current passenger and vehicle wait time guidance for all terminals in the WSF system.
Use when:
- Displaying wait time information across all terminals
- Providing arrival time recommendations for passengers
- Getting comprehensive wait time overview for planning purposes
Avoid when:
- You only need wait times for one terminal (prefer get_terminal_wait_times_by_terminal_id)
- You're not interested in arrival timing guidance
Inputs: none
Returns: array — one item per terminal
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- WaitTimes array: one or more wait time entries per terminal
- Route association: RouteID, RouteName (may be null for general terminal advice)
- Wait guidance: WaitTimeNotes (detailed arrival recommendations for vehicles and passengers)
- IVR version: WaitTimeIVRNotes (simplified notes for phone systems)
- Last updated: WaitTimeLastUpdated timestamp for freshness indication
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_wait_times_by_terminal_id (for single terminal wait times)

---

## get_terminal_wait_times_by_terminal_id

**Title:** Get Terminal Wait Times By Terminal Id

Purpose: Get current passenger and vehicle wait time guidance for a single terminal by its TerminalID.
Use when:
- Getting arrival time recommendations for a specific terminal
- Displaying wait time information for one location
- Minimizing payload when you only need wait times for one terminal
Avoid when:
- You don't know the TerminalID (prefer get_terminal_basics to discover IDs)
- You need wait times for multiple terminals (prefer get_terminal_wait_times)
Inputs:
- TerminalID: from get_terminal_basics → TerminalID
Returns: object — one terminal with wait time information
Output highlights:
- Terminal info: TerminalID, TerminalName, TerminalAbbrev (same as terminalBasics)
- WaitTimes array: one or more wait time entries for this terminal
- Route association: RouteID, RouteName (may be null for general terminal advice)
- Wait guidance: WaitTimeNotes (detailed arrival recommendations for vehicles and passengers)
- IVR version: WaitTimeIVRNotes (simplified notes for phone systems)
- Last updated: WaitTimeLastUpdated timestamp for freshness indication
Chaining:
- get_terminal_basics → extract TerminalID → call get_terminal_wait_times_by_terminal_id

---

## get_cache_flush_date_vessels

**Title:** Get Cache Flush Date Vessels

Purpose: Get the cache invalidation timestamp for static vessel data.
Use when:
- Detecting when static vessel data has been updated
- Implementing cache invalidation strategies
- Polling for data freshness
Inputs: none
Returns: string — UTC timestamp indicating when static vessel data was last updated
Output highlights:
- UTC datetime string in ISO format (e.g., '2025-11-14T06:28:07.687Z')
- May be absent if no update has occurred
- Use this to determine when to refresh cached vessel information

---

## get_vessel_accommodations

**Title:** Get Vessel Accommodations

Purpose: List amenities and accessibility features for all vessels.
Use when:
- Building vessel amenity comparison tools
- Planning accessible travel for passengers with disabilities
- Displaying comprehensive vessel feature information
Avoid when:
- You only need one vessel (prefer get_vessel_accommodations_by_vessel_id)
Inputs: none
Returns: array — one item per vessel
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class info
- Amenities: Elevator, ADAAccessible, MainCabinGalley, MainCabinRestroom, PublicWifi
- Accessibility: CarDeckRestroom, CarDeckShelter, ADAInfo (detailed text)
- AdditionalInfo may contain extra notes; ADAInfo can be long and detailed
Chaining:
- get_vessel_accommodations → extract VesselID → call get_vessel_accommodations_by_vessel_id

---

## get_vessel_accommodations_by_vessel_id

**Title:** Get Vessel Accommodations By Vessel Id

Purpose: Get amenities and accessibility features for a specific vessel.
Use when:
- Displaying vessel amenities for a selected ferry
- Checking accessibility features for trip planning
- Showing detailed accommodation information
Avoid when:
- You need all vessels (prefer get_vessel_accommodations)
Inputs:
- VesselID: numeric ID from get_vessel_accommodations → VesselID
Returns: object — one vessel's accommodation profile
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class details
- Amenities: Elevator, ADAAccessible, MainCabinGalley, MainCabinRestroom, PublicWifi
- Accessibility: CarDeckRestroom, CarDeckShelter, ADAInfo (detailed accessibility text)
- AdditionalInfo may contain extra notes; ADAInfo can be lengthy
Chaining:
- get_vessel_accommodations → extract VesselID → call get_vessel_accommodations_by_vessel_id

---

## get_vessel_basics

**Title:** Get Vessel Basics

Purpose: List basic vessel identification and operational status for the fleet.
Use when:
- Discovering VesselID values
- Building vessel pickers
- Light status checks
Avoid when:
- You need full vessel specs/amenities (prefer get_vessels_verbose_by_vessel_id)
Inputs: none
Returns: array — one item per vessel
Output highlights:
- IDs: VesselID, VesselSubjectID
- Names: VesselName, VesselAbbrev
- Class: Class.ClassID, Class.PublicDisplayName
- Status: Status (1=in service, 2=maintenance, 3=out of service)
- Ownership: OwnedByWSF
Chaining:
- get_vessel_basics → extract VesselID → call get_vessel_basics_by_vessel_id
- get_vessel_basics → extract VesselID → call get_vessel_accommodations_by_vessel_id
- get_vessel_basics → extract VesselID → call get_vessel_stats_by_vessel_id
- get_vessel_basics → extract VesselID → call get_vessel_locations_by_vessel_id

---

## get_vessel_basics_by_vessel_id

**Title:** Get Vessel Basics By Vessel Id

Purpose: Get basic vessel identification and status for a single vessel by VesselID.
Use when:
- Displaying vessel info for a selected ferry
- Enriching vessel data with basic identification
- Checking operational status of a specific vessel
Avoid when:
- You need the entire fleet (prefer get_vessel_basics)
Inputs:
- VesselID: numeric ID from get_vessel_basics → VesselID
Returns: object — one vessel's basic profile
Output highlights:
- IDs: VesselID, VesselSubjectID
- Names: VesselName, VesselAbbrev
- Class: Class.ClassID, Class.ClassName, Class.PublicDisplayName
- Status: Status (1=in service, 2=maintenance, 3=out of service)
- Ownership: OwnedByWSF
Chaining:
- get_vessel_basics → extract VesselID → call get_vessel_basics_by_vessel_id

---

## get_vessel_histories

**Title:** Get Vessel Histories

Purpose: List basic vessel information for historical sailing records (may contain mostly null data).
Use when:
- Getting a basic list of vessels with historical data available
- Discovering which vessels have voyage history
Avoid when:
- You need detailed voyage records (prefer get_vessel_histories_by_vessel_and_dates)
Inputs: none
Returns: array — one item per vessel with basic historical info
Output highlights:
- Keys: VesselId (note casing), Vessel (name)
- Terminals: Departing, Arriving (may be null)
- Time: ScheduledDepart, ActualDepart, EstArrival, Date (may be null UTC datetimes)
- Note: this endpoint often returns mostly null values
Chaining:
- get_vessel_histories → extract Vessel → call get_vessel_histories_by_vessel_and_dates

---

## get_vessel_locations

**Title:** Get Vessel Locations

Purpose: List real-time vessel locations and ETA/terminal assignment data.
Use when:
- Map displays
- Live operational dashboards
- Tracking all vessels simultaneously
Avoid when:
- You only need one vessel (prefer get_vessel_locations_by_vessel_id)
Inputs: none
Returns: array — one item per vessel location report
Output highlights:
- IDs: VesselID, DepartingTerminalID, ArrivingTerminalID
- Position: Latitude, Longitude, Speed (knots), Heading (0–359)
- Ops: InService, AtDock
- Time: TimeStamp, LeftDock, Eta, ScheduledDeparture
- Notes: VesselWatch* fields describe VesselWatch system status/messages
Chaining:
- get_vessel_locations → extract VesselID → call get_vessel_locations_by_vessel_id
- get_vessel_locations → extract VesselID → call get_vessel_basics for names

---

## get_vessel_locations_by_vessel_id

**Title:** Get Vessel Locations By Vessel Id

Purpose: Get real-time location and status for a single vessel by VesselID.
Use when:
- Tracking a specific ferry
- Getting detailed location data for one vessel
- Minimizing payload size for single vessel tracking
Avoid when:
- You need all vessels (bulk get_vessel_locations is more efficient)
Inputs:
- VesselID: numeric ID from get_vessel_basics → VesselID
Returns: object — one vessel's real-time location data
Output highlights:
- IDs: VesselID, DepartingTerminalID, ArrivingTerminalID
- Position: Latitude, Longitude, Speed (knots), Heading (0–359)
- Ops: InService, AtDock, ManagedBy (1=WSF, 2=KCM)
- Time: TimeStamp, LeftDock, Eta, ScheduledDeparture (all UTC)
- Routes: OpRouteAbbrev array, VesselPositionNum
- Notes: VesselWatch* fields provide system status and messages
Chaining:
- get_vessel_basics → extract VesselID → call get_vessel_locations_by_vessel_id

---

## get_vessel_stats

**Title:** Get Vessel Stats

Purpose: List technical specifications for all vessels in the fleet.
Use when:
- Comparing vessel capabilities
- Building technical reference databases
- Analyzing fleet specifications
Avoid when:
- You only need one vessel (prefer get_vessel_stats_by_vessel_id)
Inputs: none
Returns: array — one item per vessel
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class info
- Capacity/specs: MaxPassengerCount, RegDeckSpace, TallDeckSpace, SpeedInKnots
- Dimensions: Length, Beam, Draft (in feet/inches), Displacement, Tonnage
- Power: EngineCount, Horsepower, PropulsionInfo
- Build: YearBuilt, YearRebuilt, CityBuilt
- Large text: VesselNameDesc, VesselHistory can be lengthy descriptions
Chaining:
- get_vessel_basics → extract VesselID → call get_vessel_stats_by_vessel_id

---

## get_vessel_stats_by_vessel_id

**Title:** Get Vessel Stats By Vessel Id

Purpose: Get technical specifications for a single vessel by VesselID.
Use when:
- Detailed vessel specification pages
- Comparing specific vessel capabilities
- Minimizing payload for single vessel details
Avoid when:
- You need the entire fleet (prefer get_vessel_stats)
Inputs:
- VesselID: numeric ID from get_vessel_basics → VesselID
Returns: object — one vessel's complete technical profile
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class details
- Capacity: MaxPassengerCount, RegDeckSpace, TallDeckSpace, TallDeckClearance
- Performance: SpeedInKnots, Horsepower, EngineCount, PropulsionInfo
- Dimensions: Length, Beam, Draft (in feet/inches), Displacement, Tonnage
- Build: YearBuilt, YearRebuilt, CityBuilt, SolasCertified
- Large text: VesselNameDesc, VesselHistory can be lengthy historical info
Chaining:
- get_vessel_basics → extract VesselID → call get_vessel_stats_by_vessel_id

---

## get_vessels_verbose

**Title:** Get Vessels Verbose

Purpose: List complete vessel profiles for all vessels (basics + stats + accommodations).
Use when:
- Offline snapshots
- One-time full export
- Debugging schema differences
Avoid when:
- You only need one vessel (prefer get_vessels_verbose_by_vessel_id)
Inputs: none
Returns: array — one item per vessel
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class info
- Status/ops: Status, OwnedByWSF
- Capacity/specs: MaxPassengerCount, RegDeckSpace, TallDeckSpace, SpeedInKnots
- Amenities: Elevator, ADAAccessible, MainCabinGalley, MainCabinRestroom, PublicWifi
- Dimensions: Length, Beam, Draft, Displacement, Tonnage
- Large text: ADAInfo, VesselNameDesc, VesselHistory can be long
Chaining:
- get_vessel_basics → extract VesselID → call get_vessels_verbose_by_vessel_id

---

## get_vessels_verbose_by_vessel_id

**Title:** Get Vessels Verbose By Vessel Id

Purpose: Get the complete vessel profile for a single vessel by VesselID.
Use when:
- Detailed vessel pages
- Enriching a selected vessel
- Minimizing payload size
Avoid when:
- You need the entire fleet (prefer get_vessels_verbose)
Inputs:
- VesselID: numeric ID from get_vessel_basics → VesselID
Returns: object — one vessel profile
Output highlights:
- IDs: VesselID, VesselSubjectID, VesselName, VesselAbbrev, Class info
- Status/ops: Status, OwnedByWSF
- Specs/amenities: combines stats + accommodations in single object
- Capacity: MaxPassengerCount, vehicle spaces, passenger facilities
- Technical: dimensions, engines, speed, build details
- Large text: ADAInfo, VesselNameDesc, VesselHistory may be long
Chaining:
- get_vessel_basics → extract VesselID → call get_vessels_verbose_by_vessel_id

---

