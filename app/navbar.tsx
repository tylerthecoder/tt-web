import { cookies } from 'next/headers';
import NavbarClient from './NavbarClient';

function isLocalhost(): boolean {
    // Check if we're running on localhost
    return process.env.NODE_ENV === 'development';
}

function isAuthDisabled(): boolean {
    // Auth is disabled on localhost by default, unless FORCE_AUTH_LOCALLY is set to 'true'
    if (isLocalhost()) {
        return process.env.FORCE_AUTH_LOCALLY !== 'true';
    }
    return false;
}

export default async function Navbar() {
	// This runs on the server
	const cookieStore = await cookies();
	
	let isLoggedIn = false;

	if (isAuthDisabled()) {
		// If auth is disabled (localhost), show as logged in
		isLoggedIn = true;
	} else {
		// Check for valid authentication
		const googleUserId = cookieStore.get('googleUserId')?.value;
		const userEmail = cookieStore.get('userEmail')?.value;
		const adminEmail = process.env.ADMIN_EMAIL;

		isLoggedIn = !!(googleUserId && userEmail && adminEmail && userEmail === adminEmail);
	}

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
