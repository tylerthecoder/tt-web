import { NextPage } from "next";
import FullHeaderPage from "../views/FullHeaderPage";
import Head from "next/head";
import useTypeyText from "../hooks/useTypyText";

const Panel: NextPage = () => {
  const { typedText: welcomeMessage, cursor } = useTypeyText("Welcome Tylord");

  return (
    <FullHeaderPage>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin={"anonymous"}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
        <title> Control Panel </title>
      </Head>
      <div className="h-full bg-black text-terminal">
        <h1 className="mb-4 text-6xl font-terminal">
          {"|>"}
          {welcomeMessage}
          {cursor && <span className="w-0 -ml-2"> | </span>}
        </h1>
        <div className="flex">
          <a href="https://trello.com/personal69899119">
            <div className="p-10 m-4 text-lg border-2 border-white rounded-sm">
              Trello
            </div>
          </a>
          <a href="https://todoist.com/app/today">
            <div className="p-10 m-4 text-lg border-2 border-white rounded-sm">
              Todoist
            </div>
          </a>
          <a href="https://app.rocketmoney.com">
            <div className="p-10 m-4 text-lg border-2 border-white rounded-sm">
              Money
            </div>
          </a>
        </div>
      </div>
    </FullHeaderPage>
  );
};

export default Panel;

