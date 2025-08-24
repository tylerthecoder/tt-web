import NavbarClient from './navbar-client';

export default async function Navbar() {
	const navItems = [
		{ label: "Home", href: "/" },
		{ label: "Projects", href: "/projects" },
		{ label: "Blog", href: "/blog" }
	];

	return <NavbarClient
		navItems={navItems}
	/>;
}
