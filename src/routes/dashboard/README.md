# Dashboard Route

This directory contains the dashboard page implementation following SvelteKit conventions.

## File Structure

```
dashboard/
├── +layout.svelte      # Dashboard-specific layout wrapper
├── +page.svelte        # Main dashboard page component
├── +page.ts            # Client-side data loading
├── +page.server.ts     # Server-side data loading
└── README.md           # This file
```

## Architecture

### Layout (`+layout.svelte`)
- Wraps all dashboard pages
- Provides error boundary
- Sets up dashboard-specific layout structure

### Server Load (`+page.server.ts`)
- Runs on the server before page render
- Fetches initial data from API
- Uses `depends()` for cache invalidation
- Returns data available to both server and client

### Client Load (`+page.ts`)
- Runs in the browser
- Can access stores, localStorage, etc.
- Transforms server data if needed
- Returns data merged with server data

### Page Component (`+page.svelte`)
- Receives data from load functions via `data` prop
- Composes dashboard components
- Handles loading and error states
- Sets page metadata (title, description)

## Data Flow

```
Server API → +page.server.ts → +page.ts → +page.svelte → Components
```

## Components

Dashboard-specific components are located in:
- `$lib/components/dashboard/`

Each component follows the pattern:
- `component-name/component-name.svelte` - Component file
- `component-name/index.ts` - Barrel export

## Adding New Features

1. **Add types** to `$lib/types/dashboard.ts`
2. **Update server load** in `+page.server.ts` to fetch new data
3. **Create components** in `$lib/components/dashboard/`
4. **Compose in page** `+page.svelte`

