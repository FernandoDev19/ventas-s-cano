import { useEffect, useState } from "react";
import { isOpenAt } from "../config/bar";

export function useOpenStatus() {
  const [isOpenNow, setIsOpenNow] = useState(() => isOpenAt(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setIsOpenNow(isOpenAt(new Date())), 60000);
    return () => clearInterval(interval);
  }, []);

  return isOpenNow;
}
