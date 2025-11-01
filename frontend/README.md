# AptoCom Frontend

React-based frontend for the AptoCom AI-Powered DAO.

## Tech Stack

- **React** 18.2.0 - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Aptos SDK** - Blockchain integration
- **Axios** - HTTP client for backend API
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **React Icons** - Icon library
- **React Toastify** - Notifications

## Design System

### Colors
- **Primary Purple**: `#6C48FF` - Main brand color
- **Primary Green**: `#00FF94` - Success, secondary actions
- **Primary Yellow**: `#FFDB00` - Warning, highlights
- **Background Dark**: `#0A0E27` - Main background
- **Background Card**: `#12172F` - Card background

### Typography
- **Headings**: Montserrat (700-900 weight)
- **Body**: Inter (300-800 weight)

### Components
- Button (primary, secondary, outline, ghost, danger, warning)
- Card (default, elevated, outlined, neon border)
- Navbar (sticky navigation)
- Sidebar (collapsible navigation)
- Footer

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   ├── pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   ├── TokenPurchase.jsx
│   │   ├── Proposals.jsx
│   │   ├── ProposalDetails.jsx
│   │   ├── CreateProposal.jsx
│   │   ├── Voting.jsx
│   │   ├── Treasury.jsx
│   │   ├── Analytics.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── services/       # API and blockchain services
│   ├── hooks/          # Custom React hooks
│   ├── styles/         # Global styles
│   │   └── index.css
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── .env.example        # Environment variables template

```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your settings:**
   - Backend API URL
   - Aptos network (testnet/mainnet)
   - Contract addresses

## Development

Start the development server:
```bash
npm run dev
```

The app will run at `http://localhost:3000`

## Build

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Lint

Run ESLint:
```bash
npm run lint
```

## Features Implemented (Phase 4.1-4.3)

### ✅ Phase 4.1: Project Setup
- React app with Vite
- Project structure (components, pages, services, hooks, styles, utils)
- Dependencies installed
- Routing configured

### ✅ Phase 4.2: Design System
- Color palette defined (purple, green, yellow, orange)
- Typography system (Montserrat + Inter fonts)
- Reusable UI components:
  - Button (6 variants, 3 sizes, loading states)
  - Card (6 variants, neon borders, hover effects)
  - Navbar (sticky, wallet connection placeholder)
  - Sidebar (collapsible, navigation links)
  - Footer
- Global CSS with animations and utilities
- Responsive breakpoints (mobile, tablet, desktop)

### ✅ Phase 4.3: Basic Layout
- App shell with routing
- Navbar with logo and wallet button placeholder
- Sidebar with navigation menu
- Footer with branding
- Dashboard page with stat cards
- Placeholder pages for all routes

## Next Steps (Phase 4.4-4.5)

- [ ] Wallet Integration (Petra, Martian)
- [ ] Aptos Blockchain Service Layer
- [ ] Backend API Integration
- [ ] Custom hooks for data fetching

## Phase Breakdown

- **Phase 4.1-4.3**: ✅ Core Setup (CURRENT)
- **Phase 4.4-4.5**: Wallet & API Integration
- **Phase 4.6-4.8**: Dashboard & Token Pages
- **Phase 4.9**: Proposal Creation & Details
- **Phase 4.10**: Voting
- **Phase 4.11-4.13**: Treasury, Analytics, Profile
- **Phase 4.14**: Polish & Testing

## License

MIT
