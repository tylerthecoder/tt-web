import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';

export default function Navbar() {
	// This runs on the server
	const cookieStore = cookies();
	const isLoggedIn = cookieStore.get('session')?.value === 'authenticated';

	// Define navigation items on the server
	const navItems = [
		{ label: "Home", href: "/" },
		{ label: "Projects", href: "/projects" },
		{ label: "Blog", href: "/blog" }
	];

	if (isLoggedIn) {
		navItems.push({ label: "Panel", href: "/panel" });
		navItems.push({ label: "Notes", href: "/notes" });
		navItems.push({ label: "Lists", href: "/lists" });
	}

	// Pass navigation items and auth status to the client component
	return <NavbarClient
		navItems={navItems}
	/>;
}
