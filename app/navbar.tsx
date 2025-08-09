import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
	// This runs on the server
	const cookieStore = await cookies();
	const isLoggedIn = !!cookieStore.get('googleUserId')?.value;

	const navItems = [
		{ label: "Home", href: "/" },
		{ label: "Projects", href: "/projects" },
		{ label: "Blog", href: "/blog" }
	];

	if (isLoggedIn) {
		navItems.push({ label: "Panel", href: "/panel" });
		navItems.push({ label: "Notes", href: "/notes" });
		navItems.push({ label: "Lists", href: "/lists" });
		navItems.push({ label: "Logout", href: "/logout" });
	}

	return <NavbarClient
		navItems={navItems}
	/>;
}
