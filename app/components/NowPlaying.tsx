import { CurrentSong } from "../../services/api";
import Image from "next/legacy/image";

type Props = {
  currentSong: CurrentSong;
};

export const NowPlaying = (props: Props) => {
  const { currentSong } = props;
  const { artistName, imageUrl, name, state } = currentSong;

  const statusText =
    state === "PLAYING" ? "I'm listening to" : "I was listening to";

  return (
    <div className="flex items-center justify-center w-full">
      <p className="text-sm mr-1 text-white"> {statusText} </p>
      <div className="flex items-stretch cursor-pointer">
        <Image
          src={imageUrl}
          className="rounded-l-lg"
          width={50}
          height={50}
          alt={"spotify song cover art"}
        />
        <div className="text-white px-1 cursor-pointer bg-gray-800 rounded-r-lg flex flex-col justify-center items-center hover:bg-gray-900">
          <p className="text-sm">{name}</p>
          <p className="text-xs">by {artistName}</p>
        </div>
      </div>
    </div>
  );
};
