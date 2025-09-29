import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../services/api';
import useSearchStore from '../store/searchStore';

const SearchBar = ({ 
  variant = 'header', // 'header' or 'hero'
  placeholder = 'Search products...',
  className = '',
  showSuggestions = true
}) => {
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    setSearchTerm
  } = useSearchStore();

  // Get search suggestions when typing
  const { data: suggestions } = useQuery({
    queryKey: ['searchSuggestions', localSearchTerm],
    queryFn: () => searchAPI.searchSuggestions(localSearchTerm),
    enabled: showSuggestions && localSearchTerm.length >= 2 && isFocused,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle search submission
  const handleSearch = (searchValue = localSearchTerm) => {
    if (!searchValue.trim()) return;

    const trimmedSearch = searchValue.trim();
    
    // Add to history and global state
    addToHistory(trimmedSearch);
    setSearchTerm(trimmedSearch);
    
    // Navigate to products page with search query
    navigate(`/products?search=${encodeURIComponent(trimmedSearch)}`);
    
    // Close dropdown and blur input
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    
    if (value.length >= 2 && showSuggestions) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setLocalSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setLocalSearchTerm(historyItem);
    handleSearch(historyItem);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Styling variants
  const variants = {
    header: {
      container: 'relative w-full',
      input: 'block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
      button: 'absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors',
      searchIcon: 'h-4 w-4',
      iconContainer: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'
    },
    hero: {
      container: 'relative w-full',
      input: 'w-full px-6 py-4 text-lg rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-300 pr-20',
      button: 'absolute right-2 top-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full transition-colors',
      searchIcon: 'h-5 w-5',
      iconContainer: 'absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none'
    }
  };

  const style = variants[variant];

  return (
    <div className={`${style.container} ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        {variant === 'header' && (
          <div className={style.iconContainer}>
            <Search className={`${style.searchIcon} text-gray-400`} />
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={localSearchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            setIsFocused(true);
            if (localSearchTerm.length >= 2 || searchHistory.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={style.input}
        />

        {/* Clear button */}
        {localSearchTerm && (
          <button
            onClick={() => {
              setLocalSearchTerm('');
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          className={style.button}
        >
          {variant === 'hero' ? (
            'Search'
          ) : (
            <Search className={style.searchIcon} />
          )}
        </button>
      </div>

      {/* Dropdown with suggestions and history */}
      {showDropdown && (showSuggestions || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search History */}
          {searchHistory.length > 0 && localSearchTerm.length < 2 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
                <button
                  onClick={clearHistory}
                  className="text-gray-400 hover:text-red-500"
                  title="Clear history"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 group"
                >
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="flex-1">{item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions?.data?.products?.length > 0 && localSearchTerm.length >= 2 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Product Suggestions
              </div>
              {suggestions.data.products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded mr-3">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url || product.images[0]}
                        alt={product.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">${product.price}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {localSearchTerm.length >= 2 && suggestions?.data?.products?.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No products found for "{localSearchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;