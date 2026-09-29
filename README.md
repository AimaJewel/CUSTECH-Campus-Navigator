# CUSTECH Campus Navigator

An offline campus navigation system designed for Confluence University of Science and Technology (CUSTECH), Osara, Kogi State, Nigeria.

## Overview

CUSTECH Campus Navigator is a web-based campus navigation application developed to simplify movement around the CUSTECH campus.

The application combines an interactive 2D campus map, a 3D campus visualization, locally stored campus data, and A* pathfinding to calculate routes between campus locations.

The system is designed around the campus map and navigation network rather than relying on external mapping services.

## Features

- Interactive 2D campus map
- 3D campus visualization
- Campus building search
- Building information and images
- A* pathfinding for route calculation
- Multiple route preferences
- Turn-by-turn navigation directions
- Route distance estimation
- Estimated walking time
- Estimated walking steps
- Accessibility information
- Shaded-route information
- Minimap
- Quick search
- Layer controls
- Light and dark interface themes
- Responsive interface for desktop and mobile screens
- Frequently Asked Questions (FAQ)
- Locally bundled campus data
- Offline operation without external map APIs

## Technology Stack

| Technology    | Purpose                                      |
| ------------- | -------------------------------------------- |
| React         | User interface development                   |
| TypeScript    | Type safety and application logic            |
| Vite          | Development server and production build tool |
| Tailwind CSS  | Interface styling                            |
| Zustand       | Application state management                 |
| Framer Motion | UI animations                                |
| Lucide React  | Interface icons                              |
| HTML Canvas   | 3D campus rendering                          |
| SVG           | Interactive 2D campus map                    |
| A* Algorithm | Route/pathfinding                            |

## Project Structure

src/
├── components/
│ ├── 3d/
│ │ └── Campus3D.tsx
│ ├── map/
│ │ └── CampusMap.tsx
│ ├── minimap/
│ │ └── Minimap.tsx
│ ├── navigation/
│ │ ├── FAQPanel.tsx
│ │ └── Sidebar.tsx
│ └── overlays/
│ ├── CampusStats.tsx
│ ├── EnvironmentControls.tsx
│ ├── LayerPanel.tsx
│ ├── QuickSearch.tsx
│ ├── StatusBar.tsx
│ └── Toolbar.tsx
│
├── data/
│ ├── campus.ts
│ └── faqs.ts
│
├── engine/
│ └── pathfinding.ts
│
├── store/
│ └── useStore.ts
│
├── utils/
│ ├── cn.ts
│ └── generateTurnByTurnDirections.ts
│
└── App.tsx

\*How Navigation Works

The navigation system represents the campus as a graph consisting of nodes and edges.

Nodes represent locations such as:

-Intersections
-Entrances
-Waypoints
-Landmarks

Edges represent connections between nodes and contain information such as:

-Distance
-Path type
-Accessibility
-Shade availability

Buildings are connected to appropriate navigation nodes through a building-to-node mapping.

The application uses the A* pathfinding algorithm to search the navigation graph and calculate a route between a selected starting location and destination.

\*Route Preferences

The navigation system supports different route preferences:

-Shortest
-Accessible
-Shaded
-Fastest

The selected preference affects how the pathfinding engine evaluates available edges when calculating a route.

\*Route Statistics

After a route is calculated, the application provides information such as:

-Total distance
-Estimated walking time
-Estimated walking steps
-Accessibility status
-Percentage of shaded route
-Estimated calories
-Route edge types

The route distance is calculated from the distances of the navigation graph edges and converted from map-coordinate units to meters using the current campus map calibration.

Walking time and steps are estimated values based on predefined walking assumptions.

\*2D Campus Map

The 2D navigation interface uses an interactive SVG-based campus map.

Users can:

-View campus buildings
-Select buildings
-Search for locations
-Zoom and navigate around the map
-View calculated routes
-Interact with campus locations

The campus map is based on the available campus imagery and manually defined campus data.

\*3D Campus View

The application also provides a 3D visualization of the campus.

The 3D view is rendered using the HTML Canvas API rather than a third-party 3D rendering library.

Building height is generated from building metadata such as floor count and elevation.

\*Offline Operation

The application is designed to provide its core navigation functionality without relying on external map services.

Campus information, building data, navigation nodes, route edges, and other required application data are bundled with the application.

Route calculations are performed on the client side.

The core navigation system does not depend on:

-External map APIs
-Cloud-based navigation services
-External databases
-Internet access for route calculation
-IndexedDB
-Service Workers

This allows the application to use its locally available campus data when network access is unavailable.

\*Getting Started
Prerequisites

Before running the project, make sure the following are installed:

-Node.js
-npm
-Git

Clone the Repository:
git clone https://github.com/AimaJewel/CUSTECH-Campus-Navigator.git

Move into the project directory:
cd CUSTECH-Campus-Navigator

Install Dependencies:
npm install

This installs the dependencies defined in package.json.

Start the Development Server:
npm run dev

Vite will provide a local development address, usually similar to:

http://localhost:5173

Open the address in a web browser to run the application.

Production Build

To create a production build:
npm run build

To preview the production build locally:
npm run preview

\*Development on a Local Network
To make the development server accessible to other devices connected to the same local network:
npm run dev -- --host

Vite will provide a network address that can be accessed from another device on the same network, subject to local firewall and network settings.

\*Deployment
The application has been deployed using Vercel.

The source code is maintained in GitHub, and production deployment can be updated by pushing new changes to the repository when automatic deployment is enabled.

\*Updating Campus Data
Campus information is primarily maintained in:
src/data/campus.ts

This file contains information such as:

-Building locations
-Building names
-Building categories
-Building dimensions
-Building images
-Building metadata
-Navigation nodes
-Navigation edges
-Building-to-node relationships

Changes to the physical campus layout or navigation network can therefore be reflected by updating the campus data.

\*Known Limitations
The current implementation has some limitations:

-Campus coordinates require manual calibration.
-Walking time is an estimated value based on an assumed walking speed.
-Walking steps are estimated using an average step length.
-Calorie expenditure is an approximate calculation.
-Accessibility depends on the accessibility information assigned to individual navigation edges.
-Shaded-route information depends on shade attributes assigned to navigation edges.
-The campus navigation network requires manual updates when roads, buildings, or pathways change.
-The current campus dataset represents the selected CUSTECH campus area rather than automatically obtaining live geographic data.
-Future Improvements

Potential future improvements include:

-More precise campus distance calibration
-Improved walking-time calculations

- detailed accessibility information
  -More comprehensive pathway and shade data
  -Expanded campus coverage
  -Improved 3D visualization
  -Additional navigation preferences
  -Improved route visualization
  -More detailed building information
  -mproved campus data management
  -Project Status

The application is currently functional and deployed as a web application.

Core functionality includes:

-Campus visualization
-Location search
-Graph-based route calculation
-A* pathfinding
-Route statistics
-Turn-by-turn navigation
-Responsive user interface
-Offline use of locally bundled campus data

Further refinements may be made to the campus data, route calculations, and visualization as additional campus measurements and requirements become available.

\*Author
Jewel Aimalohi Obokhare

Computer Science

Nigeria

\*License
This project was developed as an academic and software development project for CUSTECH campus navigation.
