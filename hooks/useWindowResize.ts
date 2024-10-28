import { useEffect } from "react";

export const useWindowResize = (
  cb: (data: { width: number; height: number }) => void,
  deps: any[]
) => {
  useEffect(() => {
    const handleResize = () => {
      cb({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
};
