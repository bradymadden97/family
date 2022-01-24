import { useEffect } from "react";
import { useFetcher, useLoaderData, useLocation } from "remix";

/**
 * Handles loading data from a Remix loader, and refetching
 * it when triggered
 *
 * @returns <T>
 */
export default function useRefetch<T>(): [T, () => void] {
  const location = useLocation();
  const initialLoaderData = useLoaderData<T>();
  const fetcher = useFetcher<T>();

  const data = fetcher.data || initialLoaderData;

  const refetch = () => {
    if (document.visibilityState === "visible") {
      fetcher.load(location.pathname);
    }
  };

  return [data, refetch];
}
