import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Grid, List, Star, ShoppingCart, Heart, X } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import SearchBar from '../components/SearchBar';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCartStore();

  // Get filters from URL
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { page, search, category, minPrice, maxPrice, sortBy, sortOrder }],
    queryFn: () => productsAPI.getProducts({
      page,
      limit: 12,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    }),
    select: (response) => response.data,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories(),
    select: (response) => response.data,
  });

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', 1);
    setSearchParams(newParams);
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleAddToWishlist = (product) => {
    toast.success(`${product.name} added to wishlist!`);
  };

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 0;
  const currentPage = productsData?.currentPage || 1;

  return (
    <>
      <Helmet>
        <title>Products - Marketplace</title>
        <meta name="description" content="Browse our wide selection of products from trusted vendors." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {search ? `Search Results for "${search}"` : 'Products'}
            </h1>
            
            {/* Search Results Info */}
            {search && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <span>Found {productsData?.products?.length || 0} products</span>
                <button
                  onClick={() => setSearchParams({})}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Clear search
                </button>
              </div>
            )}
            
            {/* Search Bar */}
            <div className="max-w-md">
              <SearchBar 
                variant="header"
                placeholder="Search products..."
                showSuggestions={true}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Filter className="h-5 w-5" />
                  </button>
                </div>

                <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleFilterChange('category', '')}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          !category
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories?.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => handleFilterChange('category', cat._id)}
                          className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                            category === cat._id
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          placeholder="1000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [newSortBy, newSortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', newSortBy);
                        handleFilterChange('sortOrder', newSortOrder);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="stats.rating.average-desc">Highest Rated</option>
                      <option value="stats.sales-desc">Best Selling</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-700">
                  Showing {products.length} of {productsData?.total || 0} products
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${
                      viewMode === 'grid'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${
                      viewMode === 'list'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Products */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 group ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <div className={`relative ${viewMode === 'list' ? 'w-48' : ''}`}>
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className={`w-full object-cover rounded-t-lg ${
                            viewMode === 'list' ? 'rounded-l-lg rounded-t-none h-48' : 'h-48'
                          }`}
                        />
                        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleAddToWishlist(product)}
                            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                          >
                            <Heart className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {product.shortDescription}
                        </p>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.stats?.rating?.average || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            ({product.stats?.rating?.count || 0})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-primary-600">
                              ${product.price}
                            </span>
                            {product.comparePrice && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${product.comparePrice}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2">
                          <Link
                            to={`/products/${product._id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: currentPage - 1 })}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page })}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: currentPage + 1 })}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;

