import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCategories } from '../services/api';

const CategoryContext = createContext({
  categories: [],
  isLoading: true,
  refreshCategories: () => Promise.resolve([])
});

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      return list;
    } catch (err) {
      console.error('Error fetching real-time categories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <CategoryContext.Provider value={{ categories, isLoading, refreshCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}
