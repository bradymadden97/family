import { useEffect } from "react";
import { useFetcher, useLoaderData, useLocation } from "remix";
import useRefetch from "./useRefetch";

/**
 * Handles loading data from a Remix loader, and refetching it when
 * the browser experiences a "visibilitychange" event
 *
 * @returns <T>
 */
export default function useRefetchOnVisible<T>(): T {
  const [data, refetch] = useRefetch<T>();
  useEffect(() => {
    document.addEventListener("visibilitychange", refetch);
    return () => document.removeEventListener("visibilitychange", refetch);
  }, []);

  return data;
}
