// Navigation items with simple text or HTML entities for icons
export const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    // Use a simple span that we can style with CSS instead of an icon component
    iconElement: () => <span className="inline-block w-5 h-5 text-center">🏠</span>,
  },
  {
    title: 'Notes',
    href: '/notes',
    iconElement: () => <span className="inline-block w-5 h-5 text-center">✏️</span>,
  },
  {
    title: 'Google Docs',
    href: '/google/docs',
    iconElement: () => <span className="inline-block w-5 h-5 text-center">☁️</span>,
  },
];
