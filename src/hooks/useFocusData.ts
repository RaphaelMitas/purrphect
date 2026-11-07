import { useFocusEffect } from "expo-router";
import { type SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";

export function useFocusData<T>(load: (db: SQLiteDatabase) => Promise<T>): [T | undefined, () => void] {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>();
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(() => {
    let active = true;
    loadRef
      .current(db)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [db]);

  useFocusEffect(reload);
  return [data, reload];
}
