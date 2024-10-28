"use client"
import Link from "next/link"
import { usePathname } from "next/navigation";

interface NavItemProps {
	label: string;
	href: string;
}

const NavItem = (props: NavItemProps) => {
    const pathname = usePathname();
    const isActive = pathname === props.href;

    let className = "p-5 cursor-pointer text-white hover:bg-red-500";
    if (isActive) {
        className += " border-b-2 border-red-500"
    }

	return <Link href={props.href} >
		<li className={className}>
			{props.label}
		</li>
	</Link>
}


const NavBar = () => {
	return <nav className="flex z-10 bg-gray-950">
		<ul className="flex border-b-2 border-black w-full">
			<NavItem label="Home" href="/" />
			<NavItem label="Projects" href="/projects" />
			<NavItem label="Blog" href="/blog" />
		</ul>
	</nav>
}

export default NavBar
