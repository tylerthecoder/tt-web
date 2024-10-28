import { NextPage } from "next";
import headshot from "../public/headshot.webp";
import supplypikeImg from "../public/supplypike.png";
import gcloudImg from "../public/gcloud.png";
import Image, { StaticImageData } from "next/legacy/image";
import { motion } from "framer-motion";
import HeaderPage from "../views/HeaderPage";
import { BouncingBackground } from "../components/Backgrounds/BouncingBackground";

const FallingBookmark = () => {
  return (
    <motion.div
      animate={{
        y: [-400, 0],
        display: "block"
      }}
      className="hidden"
    >
      <div className="p-4 pt-8 white bg-gray-600 rounded-b-3xl overflow-hidden border-l-4 border-r-4 border-b-4 border-red-700 shadow-2xl">
        <h1 className="text-center text-4xl"> Hi I'm Tyler </h1>
        <Image src={headshot} alt="headshot" layout="responsive" />
      </div>
    </motion.div>
  );
};

const WorkCard = (props: {
  img: StaticImageData;
  alt: string;
  label: string;
}) => {
  return (
    <div className="w-[300px] m-4 relative bg-slate-100 p-3 rounded-3xl box-border">
      <Image src={props.img} alt={props.alt} layout="responsive" />
      <p className="fun-text text-black text-center"> {props.label} </p>
    </div>
  );
};

const About: NextPage = () => {
  return (
    <HeaderPage>
      <div className={"flex flex-grow relative"}>
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
          <BouncingBackground />
        </div>
        <div className={"absolute top-0 left-8"}>
          <FallingBookmark />
        </div>
        <div className="w-1/5"></div>
        <div className="p-5 max-w-[1000px] body-text text-white z-1">
          <p>
            {" "}
            Hello! My name is Tyler Tracy. I'm a full stack developer. I
            graduated from the University of Arkansas in December 2020 with a
            B.S. in Computer Science.
          </p>

          <h3 className="text-2xl font-bold mt-4"> Experience </h3>

          <div className="flex">
            <WorkCard
              alt="supplypike"
              img={supplypikeImg}
              label={"Former software engineer"}
            />
            <WorkCard
              alt="gcloud"
              img={gcloudImg}
              label={"Cloud AI engineer"}
            />
          </div>

          <p>
            Around the age of 30, I plan to start my world domination plan. I
            will topple governments and destroy world organizations, all in
            hopes to start the next phase of humanity. To accomplish this, a
            large amount of stealth and charisma will be used. The abolition of
            human operated cars, Mars colonization, and the creation of a Dyson
            sphere around our sun will then be of utmost priority to me in order
            to rapidly progress the human race. I will work from the shadows and
            create powerless figure heads making me virtually immune from
            assassination. If all goes well immortality will be common place by
            my 60s so death will elude me forever. I will live out my days on a
            farm to finally rest, and watch the sun rise on a grateful universe
            :)
          </p>
        </div>
      </div>
    </HeaderPage>
  );
};

export default About;

