import NavbarClient from './NavbarClient';
import { getIsLoggedIn, isAuthDisabled } from './utils/auth';

export default async function Navbar() {
	let isLoggedIn = await getIsLoggedIn();

	const navItems = [
		{ label: "Home", href: "/" },
		{ label: "Projects", href: "/projects" },
		{ label: "Blog", href: "/blog" }
	];

	if (isLoggedIn) {
		navItems.push({ label: "Panel", href: "/panel" });
		navItems.push({ label: "Notes", href: "/notes" });
		navItems.push({ label: "Lists", href: "/lists" });
		// Only show logout if auth is not disabled
		if (!isAuthDisabled()) {
			navItems.push({ label: "Logout", href: "/logout" });
		}
	}

	return <NavbarClient
		navItems={navItems}
	/>;
}
