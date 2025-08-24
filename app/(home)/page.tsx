'use client';
import { Bubblegum_Sans } from 'next/font/google';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import headshotPic from '../../public/headshot.webp';
import { RandomBackground } from '../components/Backgrounds/RandomBackground';
import { CrazyImage } from '../components/CrazyImage';
import { NowPlaying } from '../components/NowPlaying';
import useTypeyText from '../hooks/useTypyText';
import API, { CurrentSong } from '../services/api';

const bubblegum = Bubblegum_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const RESUME_URL = 'https://files.tylertracy.com/resume.pdf';
const YOUTUBE_URL = 'https://www.youtube.com/channel/UCUdKa40A3qNa1cN2gK9Qb8g';
const LINKEDIN_URL = 'https://www.linkedin.com/in/tyler-tracy/';
const GITHUB_URL = 'https://github.com/tylerthecoder';
const X_URL = 'https://twitter.com/tylertracy321';
const BLOG_URL = 'https://tylertracy.com/blog';
const TYLERCRAFT_URL = 'https://craft.tylertracy.com/?worldId=0.9484798532361967';
const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/citations?user=gdsMjNwAAAAJ&hl=en';

const Subtitle = () => {
  const { typedText, cursor } = useTypeyText('AI Safety Researcher');

  return (
    <div>
      <p className={`text-white text-center text-xl h-8 ${bubblegum.className}`}>
        {typedText}
        {cursor && <span className="w-0"> | </span>}
      </p>
    </div>
  );
};

const HomButton = (props: { href: string; iconSrc: string; iconAlt: string; text: string }) => {
  return (
    <Link href={props.href} passHref>
      <button
        className="
        w-full mb-2
        py-2 px-4 font-semibold border-2 border-white
        rounded-lg shadow-md text-white bg-gray-400 bg-opacity-70
        transform scale-100 duration-150 hover:scale-110 hover:bg-opacity-90
        flex items-center justify-center
      "
      >
        <div className="mr-1">
          <Image src={props.iconSrc} width={32} height={32} alt={props.iconAlt} />
        </div>
        <p className="w-[60px]">{props.text}</p>
      </button>
    </Link>
  );
};

const Home = () => {
  const showBg = true;
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    const song = await API.getCurrentSong();
    setCurrentSong(song);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNameDoubleClick = () => {
    router.push('/login');
  };

  return (
    <div>
      <Head>
        <title>Tyler Tracy</title>
      </Head>

      <RandomBackground />

      <div className="w-full h-full flex md:flex-row flex-col">
        <div className="md:w-[300px] w-full md:border-r-2 border-white mx-2 px-2">
          <div className="flex justify-center z-0">
            <CrazyImage src={headshotPic} alt="Tyler's headshot" width={225} height={300} />
          </div>
          <div className="pt-3 w-full">
            {!!currentSong && <NowPlaying currentSong={currentSong} />}
          </div>
          <div className="pt-3 w-full">
            <HomButton
              text="Resume"
              iconAlt="Resume icon"
              iconSrc="/resume.svg"
              href={RESUME_URL}
            />
            <HomButton
              text="Github"
              href={GITHUB_URL}
              iconSrc="/github.png"
              iconAlt="Github logo"
            />
            <HomButton text="Twitter" href={X_URL} iconSrc="/x.svg" iconAlt="X logo" />
            <HomButton
              text="LinkedIn"
              href={LINKEDIN_URL}
              iconSrc="/linkedin.svg"
              iconAlt="Linkedin logo"
            />
            <HomButton text="Blog" href={BLOG_URL} iconSrc="/blog.png" iconAlt="Blog icon" />
            <HomButton
              text="Enter 3D"
              href={TYLERCRAFT_URL}
              iconSrc="/3d.png"
              iconAlt="Tylercraft Icon"
            />
            <HomButton
              text="Google Scholar"
              href={GOOGLE_SCHOLAR_URL}
              iconSrc="/scholar.png"
              iconAlt="Google Scholar icon"
            />
          </div>
        </div>
        <div className="md:overflow-y-auto w-full">
          <div className="flex-grow my-2 max-w-[800px] mx-auto ">
            <h1
              className={`text-6xl text-white text-center ${bubblegum.className}`}
              onDoubleClick={handleNameDoubleClick}
            >
              Hi, I'm Tyler
            </h1>
            <Subtitle />
            <article
              className={`mt-4 mx-3 prose lg:prose-2xl prose-neutral prose-invert ${bubblegum.className}`}
            >
              <h2> Quick Facts </h2>
              <ul>
                <li>
                  {' '}
                  Member of Technical Staff at{' '}
                  <a href="https://redwoodresearch.org" target="_blank" rel="noopener noreferrer">
                    Redwood Research
                  </a>{' '}
                </li>
                <li>Working on High-Stakes AI Control research</li>
                <li>
                  Was a software engineer, realized AI was a big deal, quit my job, now I'm here
                </li>
              </ul>

              <h2> Core beliefs </h2>
              <ul>
                <li>
                  {' '}
                  AI is the most important invention of humanity and will have dramatic consequences
                  on the future of the universe
                </li>
                <li>We should aim to increase understanding in the universe</li>
                <li>
                  All software and information that does not pose an existential threat should be
                  open-sourced for everyone to access
                </li>
                <li>
                  All living creatures capable of experiencing suffering deserve to be treated with
                  moral consideration.
                </li>
                <li>
                  {' '}
                  Things used to be worse, they are better now, and they could be even better{' '}
                </li>
              </ul>

              <h2> Goals </h2>
              <ul>
                <li>Maximize the amount of experience that I have (live forever)</li>
                <li>Prevent AI from taking over the world</li>
                <li> Build the ultimate productivity workflow </li>
              </ul>

              <h2> Hot Takes </h2>
              <ul>
                <li> Browsers are an anti-pattern </li>
                <li> You don't know what consciousness is </li>
                <li> ML is stupid, Good old fashioned AI would have worked </li>
              </ul>

              <h2> Phrases </h2>
              <ul>
                <li> Always in progress </li>
                <li> I use arch & neovim btw </li>
                <li> Everything is a function </li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
