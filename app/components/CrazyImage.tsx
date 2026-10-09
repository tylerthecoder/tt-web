import Image, { type StaticImageData } from 'next/image';

type Props = {
  src: StaticImageData;
  alt: string;
  width: number;
  height: number;
};

export const CrazyImage = ({ src, alt, width, height }: Props) => (
  <div className="flex justify-center relative" style={{ width }}>
    <Image
      src={src}
      alt={`${alt} inverted`}
      className="invert object-cover object-left-top"
      fill
      sizes={`${width}px`}
      preload
    />
    <div
      style={{
        animationName: 'imageSlider',
        animationDelay: '1s',
        animationDuration: '2s',
        width,
        height,
      }}
      className="overflow-x-hidden relative"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${width}px`}
        className="object-cover object-left-top"
        preload
      />
    </div>
  </div>
);
