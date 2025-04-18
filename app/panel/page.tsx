import { Bubblegum_Sans } from 'next/font/google';
import Link from "next/link";
import Image from "next/image";
import { getCurrentWeek } from './actions';
import { AgeCounter } from '../components/age-counter';
import { WeeklyProgress } from './weekly-progress';
import { CountdownTimer } from '../components/countdown-timer';
import { PanelTabsClient } from './PanelTabsClient';
import { DatabaseSingleton } from 'tt-services/src/connections/mongo';
import { TylersThings } from 'tt-services/src/lib';

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
    const db = await DatabaseSingleton.getInstance();
    const tt = await TylersThings.make(db);
    const jots = await tt.jots.getAllJots();

    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 bg-gray-800 bg-opacity-50 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <WeeklyProgress
                        startDate={week.startDate}
                        endDate={weekEnd.toISOString()}
                    />
                    <div className="flex flex-col items-end">
                        <AgeCounter />
                        <CountdownTimer />
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden">
                <PanelTabsClient week={week} initialJots={jots} />
            </div>
        </div>
    );
}