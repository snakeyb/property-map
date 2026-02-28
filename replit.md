# Property Map Application

## Overview
Interactive property mapping web application that displays properties as clustered markers on a Leaflet map. Data is loaded from an EspoCRM API endpoint with pagination handling. Features include filter sidebar with range sliders and multi-select dropdown.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Leaflet + MarkerCluster
- **Backend**: Express.js API proxy to EspoCRM
- **Data Source**: https://pf.wspp.co.uk/api/v1/CUnits (paginated with maxSize=200)

## Key Files
- `shared/schema.ts` - Property types and filter schemas
- `client/src/pages/Home.tsx` - Main page with map + filter layout
- `client/src/components/PropertyMap.tsx` - Leaflet map with marker clustering
- `client/src/components/FilterPanel.tsx` - Sidebar filter controls
- `client/src/components/MobileFilterSheet.tsx` - Mobile bottom sheet filters
- `server/routes.ts` - API proxy endpoint
- `server/storage.ts` - EspoCRM data fetching with pagination and caching

## API Endpoints
- `GET /api/properties` - Returns all properties (cached), use `?refresh=true` to force re-fetch

## Style Guide
- Primary: #4A6492, Success: #10B981, Background: #F9FAFB, Text: #1F2937
- Font: Inter/System UI
- 12px border radius on cards, 16px spacing
