import Image from 'next/image';
// Filter out video files and get only image files
const images = [
  'PXL_20211210_220446467.jpg',
  'PXL_20211211_214840719.jpg',
  'PXL_20211212_182457494.MP.jpg',
  'PXL_20211230_191650759.jpg',
  'PXL_20220116_041346031.jpg',
  'PXL_20220705_214211616.jpg',
  'PXL_20221030_032731082.jpg',
  'PXL_20221119_040507463.jpg',
  'PXL_20230107_175319334.jpg',
  'PXL_20230616_235826194.jpg',
  'PXL_20230710_233157781.jpg',
  'PXL_20230713_001116329.jpg',
  'PXL_20230717_035941831.jpg',
  'PXL_20231112_011545858.jpg',
  'PXL_20240115_211611059.jpg',
  'PXL_20240728_011317526.jpg',
  'PXL_20241018_105519364.ACTION_PAN-01.COVER.jpg',
  'PXL_20250208_235947605.jpg',
  'IMG_0915.HEIC',
  'IMG_1211.HEIC',
  'IMG_2897.HEIC',
  'IMG_3711.HEIC',
  'IMG_3793.HEIC',
  'IMG_3948.HEIC',
  'IMG_4098.HEIC',
  'IMG_4147.HEIC',
  'IMG_5145.HEIC',
  'IMG_6719.HEIC',
  'IMG_6810.HEIC',
  'IMG_6862.HEIC',
  'IMG_7074.HEIC',
  'IMG_7140.HEIC',
].map((filename) => `/tyler-logan-photos/${filename}`);

export default function LovePage() {
  return (
    <div className="min-h-screen p-8 md:p-8 bg-gradient-to-br from-pink-100 to-pink-200">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4 animate-pulse">
          Happy Valentine&apos;s Day!
        </h1>
        <p className="text-xl md:text-2xl text-red-500">A collection of our memories together ❤️</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
        {images.map((src, index) => (
          <div key={src} className="relative aspect-square w-full">
            <Image
              src={src}
              alt={`Memory ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              priority={index < 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
