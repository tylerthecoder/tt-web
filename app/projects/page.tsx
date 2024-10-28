import Image from "next/legacy/image";
import API, { Creation } from "../../services/api";

interface IProjectProps {
	creation: Creation;
}

// convert creation name to kebab case, remove special characters
const kebabCase = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9\'\+]/g, "-").replace(/[\'\+]/g, "");
}

const Project = ({ creation }: IProjectProps) => {
	return <a href={creation.link} target="_blank"
        rel="noopener noreferrer"
    >
    <div
		className="
            text-lg
			relative w-fit m-auto
			shadow-lg bg-orange-950 rounded
			transition ease-in-out
			hover:shadow-2xl hover:cursor-pointer
			hover:transform hover:scale-110 hover:z-10
		"
	>
        <Image
            src={"/thumbnails/" + kebabCase(creation.name) + ".png"}
            alt={creation.name}
            width={256 * 1.2}
            height={144 * 1.2}
        />
		<div className="px-4 py-2 text-center text-white">
			<p> {creation.name} </p>
		</div>
	</div>
    </a>
}

export default async function Projects() {
	const creations = await API.getCreations();

	return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10 mx-[30px]">
            {creations.map(creation => <Project key={creation.name} creation={creation} />)}
        </div>
	)
}


