import { cookies } from 'next/headers';
import NavItem from "./navitem";



const NavBar = () => {
	const isLoggedIn = cookies().get('session')?.value === 'authenticated';

	return <nav className="flex z-10 bg-gray-950">
		<ul className="flex border-b-2 border-black w-full">
			<NavItem label="Home" href="/" />
			<NavItem label="Projects" href="/projects" />
			<NavItem label="Blog" href="/blog" />
			{isLoggedIn && (
				<>
					<NavItem label="Panel" href="/panel" />
					<NavItem label="Notes" href="/notes" />
				</>
			)}
		</ul>
	</nav>
}

export default NavBar
