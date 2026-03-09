import React, { createContext, useState, useEffect, useCallback } from "react";
import { baseUrl } from "../config/api";

export const FiscalYearContext = createContext({
  fys: [],
  selectedFy: null,
  setSelectedFy: () => {},
  loading: true,
});

const STORAGE_KEY = "kpcl_selected_fy";
const DEFAULT_FY = "FY25-26";

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(fy) {
  try {
    if (fy) localStorage.setItem(STORAGE_KEY, fy);
  } catch {
    /* ignore */
  }
}

export function FiscalYearProvider({ children }) {
  const [fys, setFys] = useState([]);
  const [selectedFy, setSelectedFyState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFys() {
      try {
        const res = await fetch(`${baseUrl}/api/v1/dashboard/fys`);
        const json = await res.json();
        const list = Array.isArray(json.fys) ? json.fys : [];
        setFys(list);

        const stored = readStorage();
        let initial = null;
        if (stored && list.includes(stored)) {
          initial = stored;
        } else if (list.includes(DEFAULT_FY)) {
          initial = DEFAULT_FY;
        } else {
          initial = list[list.length - 1] || null;
        }

        setSelectedFyState(initial);
        writeStorage(initial);
      } catch (err) {
        console.error("Failed to load FY options:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFys();
  }, []);

  const setSelectedFy = useCallback((fy) => {
    setSelectedFyState(fy);
    writeStorage(fy);
  }, []);

  return (
    <FiscalYearContext.Provider value={{ fys, selectedFy, setSelectedFy, loading }}>
      {children}
    </FiscalYearContext.Provider>
  );
}
