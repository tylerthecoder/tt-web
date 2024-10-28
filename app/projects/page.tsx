import Image from "next/legacy/image";
import API, { Creation } from "../../services/api";
import { TylersThingsService } from "../tt-service";

interface IProjectProps {
	creation: Creation;
}

// convert creation name to kebab case, remove special characters
const kebabCase = (name: string) => {
	return name.toLowerCase().replace(/[^a-z0-9\'\+]/g, "-").replace(/[\'\+]/g, "");
}

const Project = ({ creation }: IProjectProps) => {
	return (
		<a href={creation.link}
		   target="_blank"
		   rel="noopener noreferrer"
		   className="block group"
		>
			<div className="
				bg-orange-950
				rounded-lg
				overflow-hidden
				transition-all
				duration-300
				transform
				hover:scale-[1.02]
				hover:shadow-xl
				shadow-md
			">
				<div className="relative aspect-video">
					<Image
						src={"/thumbnails/" + kebabCase(creation.name) + ".png"}
						alt={creation.name}
						layout="fill"
						objectFit="cover"
						className="transition-transform duration-300 group-hover:scale-105"
					/>
				</div>
				<div className="p-6">
					<h3 className="text-xl font-bold text-white mb-2">
						{creation.name}
					</h3>
					<p className="text-orange-200 text-sm line-clamp-3">
						{creation.description}
					</p>
					<div className="mt-4 flex items-center text-orange-300 text-sm">
						<span className="inline-block">
							View Project →
						</span>
					</div>
				</div>
			</div>
		</a>
	)
}

export default async function Projects() {
	const tylersThings = await TylersThingsService.get();
	const creations = await tylersThings.creations.getPublishedCreations();

	return (
		<div className="container mx-auto px-4 py-12">
			<h1 className="text-4xl font-bold text-center mb-12 text-white">
				Projects
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{creations.map(creation => (
					<Project key={creation.name} creation={creation} />
				))}
			</div>
		</div>
	)
}
