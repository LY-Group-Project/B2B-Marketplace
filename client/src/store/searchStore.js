import { create } from "zustand";

const useSearchStore = create((set, get) => ({
  // Search state
  searchTerm: "",
  searchResults: [],
  isSearching: false,
  searchHistory: JSON.parse(localStorage.getItem("searchHistory") || "[]"),

  // Search filters
  filters: {
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () =>
    set({
      filters: {
        category: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    }),

  // Add to search history
  addToHistory: (term) => {
    if (!term.trim()) return;

    const { searchHistory } = get();
    const newHistory = [
      term,
      ...searchHistory.filter((item) => item !== term),
    ].slice(0, 10);

    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    set({ searchHistory: newHistory });
  },

  // Clear search history
  clearHistory: () => {
    localStorage.removeItem("searchHistory");
    set({ searchHistory: [] });
  },

  // Remove item from history
  removeFromHistory: (term) => {
    const { searchHistory } = get();
    const newHistory = searchHistory.filter((item) => item !== term);

    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    set({ searchHistory: newHistory });
  },

  // Set search results
  setSearchResults: (results) => set({ searchResults: results }),

  // Set loading state
  setIsSearching: (loading) => set({ isSearching: loading }),

  // Clear search
  clearSearch: () =>
    set({
      searchTerm: "",
      searchResults: [],
      isSearching: false,
    }),
}));

export default useSearchStore;
