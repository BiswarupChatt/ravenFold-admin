import { useEffect, useState, useRef, useCallback } from "react";


/**
 * React hook for auto-revalidating an API response on a fixed interval, with mutate support.
 *
 * @param {string} url - API endpoint (relative to http baseURL).
 * @param {Object} options - Optional get() options (headers, cacheTTLinMs).
 * @param {number} intervalMs - Interval in ms to auto-revalidate.
 * @returns {{ data: any, error: any, loading: boolean, mutate: Function }}
 *
 * @example
 * const { data, error, loading, mutate } = useAutoRevalidate("/users", {}, 5000);
 * mutate();                   // Revalidate now
 * mutate(updatedData, false); // Optimistically update local state without fetch
 * 
 * 
 * @example
 * import React from "react";
import { useAutoRevalidate } from "../hooks/useAutoRevalidate.js";

export default function UserList() {
  const { data: users, error, loading, mutate } = useAutoRevalidate("/users", {}, 5000);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
      <button onClick={() => mutate()}>Refresh Now</button>
      <button
        onClick={() =>
          mutate([{ id: 999, name: "Optimistic User" }, ...users], false)
        }
      >
        Add Optimistic User
      </button>
    </div>
  );
}

 */
export function useAutoRevalidate(url, options = {}, intervalMs = 0) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // const result = await http.get(url, options);
      setData(result);
      setError(undefined);
    } catch (err) {
      setError(err);
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    if (intervalMs > 0) {
      intervalRef.current = setInterval(fetchData, intervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, intervalMs]);

  /**
   * Mutate function: manually update state or force revalidation.
   * @param {any} newData - If provided, sets data directly; if undefined, triggers re-fetch.
   * @param {boolean} revalidate - If true, will force fetch even with newData.
   */
  const mutate = useCallback(
    async (newData, revalidate = true) => {
      if (newData !== undefined) {
        setData(newData);
      }
      if (revalidate) {
        await fetchData();
      }
    },
    [fetchData]
  );

  return { data, error, loading, mutate };
}
