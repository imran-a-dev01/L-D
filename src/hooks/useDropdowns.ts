import { useState, useEffect } from 'react';
import { dropdownService, DropdownData } from '../services/dropdownService';

export function useDropdowns(): DropdownData {
  const [data, setData] = useState<DropdownData>(() => dropdownService.get());

  useEffect(() => {
    const unsubscribe = dropdownService.subscribe(setData);
    // Refresh from SQLite DB
    dropdownService.fetchAll();
    return unsubscribe;
  }, []);

  return data;
}
