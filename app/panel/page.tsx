import { Bubblegum_Sans } from 'next/font/google';
import Link from "next/link";
import Image from "next/image";
import { WeeklyTodos } from './weekly-todos';
import { MilkdownEditorWrapper } from "./markdown-editor";
import { getCurrentWeek } from './actions';

const bubblegum = Bubblegum_Sans({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

const PanelButton = (props: {
    href: string;
    iconSrc: string;
    iconAlt: string;
    text: string;
}) => {
    return (
        <Link href={props.href} passHref>
            <button
                className="
                    mx-2 mb-2
                    py-2 px-4 font-semibold border-2 border-white
                    rounded-lg shadow-md text-white bg-gray-400 bg-opacity-70
                    transform scale-100 duration-150 hover:scale-110 hover:bg-opacity-90
                    flex items-center justify-center
                "
            >
                <div className="mr-2">
                    <Image
                        src={props.iconSrc}
                        width={24}
                        height={24}
                        alt={props.iconAlt}
                    />
                </div>
                <span>{props.text}</span>
            </button>
        </Link>
    );
};

const GITHUB_URL = "https://github.com/tylerthecoder";
const ROCKET_URL = "https://app.rocketmoney.com";

export default async function PanelPage() {
    const week = await getCurrentWeek();

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex flex-wrap justify-center p-4 bg-gray-800 bg-opacity-50">
                <PanelButton
                    text="Github"
                    href={GITHUB_URL}
                    iconSrc="/github.png"
                    iconAlt="Github logo"
                />
                <PanelButton
                    text="Rocket Money"
                    href={ROCKET_URL}
                    iconSrc="/money.png"
                    iconAlt="Rocket Money logo"
                />
            </div>

            <div className="flex flex-col lg:flex-row flex-grow p-4 gap-4">
                <div className="w-full lg:w-1/3 min-h-[300px] lg:min-h-0">
                    <WeeklyTodos />
                </div>
                <div className="w-full lg:w-2/3 min-h-[500px] lg:min-h-0">
                    <MilkdownEditorWrapper noteId={week.noteId} />
                </div>
            </div>
        </div>
    );
}