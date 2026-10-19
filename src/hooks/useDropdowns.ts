import { useState, useEffect, useCallback } from 'react';
import { dropdownService, DropdownData, DropdownState } from '../services/dropdownService';

export interface UseDropdownsResult extends DropdownData {
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  retry: () => void;
}

export function useDropdowns(): UseDropdownsResult {
  const [state, setState] = useState<DropdownState>(() => dropdownService.getState());

  useEffect(() => {
    const unsubscribe = dropdownService.subscribe(setState);
    dropdownService.fetchAll();
    return unsubscribe;
  }, []);

  const retry = useCallback(() => {
    dropdownService.fetchAll();
  }, []);

  return {
    ...state.data,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    retry,
  };
}
