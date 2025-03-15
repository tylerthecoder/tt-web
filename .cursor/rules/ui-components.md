# UI Component Guidelines

The project uses React components with a mix of server and client components.

## Naming Conventions

- Components use PascalCase for filenames and component names
- Client components should use the `Client` suffix (e.g., `NavbarClient.tsx`)
- Server components should not have a special suffix (e.g., `navbar.tsx`)
- Component interfaces should use `Props` suffix (e.g., `NavbarProps`, `NavbarClientProps`)

## Styling

- The project uses Tailwind CSS for styling
- Follow utility-first approach with Tailwind classes
- Use consistent spacing and color variables
- Responsive design uses Tailwind breakpoints (`md:`, `lg:`, etc.)

## Component Structure

- Props should be typed with TypeScript interfaces
- Client components should use appropriate React hooks:
  - `useState` for component state
  - `useEffect` for side effects
  - `usePathname` for routing information
- Server components should handle data fetching and authentication

## Responsive Design

- Mobile-first approach for responsive design
- Desktop navigation uses horizontal layout with underline for active items
- Mobile navigation uses a hamburger menu and full-page overlay
- Use `isMobile` state in client components to manage responsive behavior

## Icons

- Use React Icons library (e.g., `FaBars`, `FaTimes` from 'react-icons/fa')
- Ensure icons have appropriate accessibility attributes

## Accessibility

- Include appropriate aria-labels for interactive elements
- Maintain semantic HTML structure
- Ensure sufficient color contrast with Tailwind classes