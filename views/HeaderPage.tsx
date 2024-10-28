import NavBar from "../app/navbar";


interface Props {
	children: React.ReactNode;
}

const HeaderPage = ({ children }: Props) => {
	return <div
		className="flex flex-col h-screen relative bg-gray-800 "
	>
		<NavBar />
		{children}
	</div>
}

export default HeaderPage;