# Design Guidelines for Shopify Pixel Analytics Dashboard

## Design Approach
**Utility-Focused Design System Approach** - Following Material Design principles adapted for data visualization and developer tools. This dashboard prioritizes functionality, data clarity, and efficient navigation over visual flourishes.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary (Default)**
- Background: `222 23% 11%` (dark slate)
- Surface: `222 23% 16%` (elevated dark)
- Primary: `210 100% 56%` (bright blue for actions)
- Text Primary: `210 20% 95%` (near white)
- Text Secondary: `210 15% 70%` (muted gray)
- Success: `142 71% 45%` (green for successful events)
- Warning: `45 93% 58%` (amber for errors)
- Border: `222 23% 25%` (subtle borders)

**Light Mode Alternative**
- Background: `0 0% 98%` (off-white)
- Surface: `0 0% 100%` (pure white)
- Primary: `210 100% 50%` (strong blue)
- Text Primary: `222 47% 11%` (dark slate)

### B. Typography
- **Primary Font**: Inter (Google Fonts) - excellent for data displays
- **Monospace**: JetBrains Mono (Google Fonts) - for event IDs and JSON data
- **Hierarchy**: 
  - Headers: font-semibold text-xl to text-3xl
  - Body: font-normal text-sm to text-base
  - Captions: font-medium text-xs (for timestamps, metadata)

### C. Layout System
**Tailwind Spacing Primitives**: Consistent use of 2, 4, 6, 8, 12, 16 units
- Component padding: `p-4` to `p-6`
- Section margins: `mb-8` to `mb-12`
- Grid gaps: `gap-4` to `gap-6`
- Icon spacing: `mr-2`, `ml-2`

### D. Component Library

**Navigation**
- Fixed sidebar with collapsed/expanded states
- Tab navigation for different event types
- Breadcrumbs for deep navigation

**Data Display**
- Event cards with clear hierarchy (event type, timestamp, details)
- Collapsible JSON viewers with syntax highlighting
- Data tables with sorting and filtering
- Real-time event counters and status indicators

**Forms & Controls**
- Search bars with autocomplete
- Date/time range selectors
- Filter dropdowns with multi-select
- Toggle switches for real-time updates

**Feedback**
- Toast notifications for new events
- Loading skeletons for data fetching
- Empty states with helpful guidance
- Connection status indicators

### E. Dashboard-Specific Elements

**Event Stream**
- Real-time feed with smooth animations for new events
- Color-coded event types (page_viewed: blue, product_viewed: green, cart_updated: orange)
- Expandable event details with formatted JSON
- Quick action buttons for common operations

**Analytics Cards**
- Metric cards showing event counts, unique visitors, conversion rates
- Clean typography hierarchy with large numbers and descriptive labels
- Subtle background gradients for visual interest without distraction

**Filters Panel**
- Collapsible left panel with event type filters
- Date range picker with preset options
- Search functionality with keyboard shortcuts
- Clear all filters action

## Key Design Principles

1. **Data First**: Every design decision prioritizes data readability and quick scanning
2. **Progressive Disclosure**: Show essential information first, detailed data on demand
3. **Consistent Patterns**: Reusable components across all views
4. **Developer-Friendly**: Familiar patterns from popular dev tools (GitHub, Linear, Vercel)
5. **Real-time Clarity**: Clear indicators for live data vs historical data

## No Hero Images
This dashboard app requires no hero imagery - it's a functional tool focused entirely on data presentation and analysis.

## Animations
Minimal and purposeful only:
- Smooth transitions for sidebar collapse/expand
- Subtle fade-in for new events in real-time feed
- Loading states with skeleton placeholders
- No decorative animations

This design system ensures a professional, efficient dashboard that developers will find familiar and productive to use.