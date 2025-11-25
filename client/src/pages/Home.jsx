import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Star, ShoppingCart, Heart, Eye } from "lucide-react";
import { productsAPI, categoriesAPI } from "../services/api";
import useCartStore from "../store/cartStore";
import SearchBar from "../components/SearchBar";
import toast from "react-hot-toast";

const Home = () => {
  const { addItem } = useCartStore();

  // Fetch featured products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productsAPI.getFeaturedProducts({ limit: 8 }),
    select: (response) => response.data,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesAPI.getCategories(),
    select: (response) => response.data,
  });

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleQuickView = (product) => {
    // Implement quick view modal
    console.log("Quick view:", product);
  };

  const handleAddToWishlist = (product) => {
    // Implement wishlist functionality
    console.log("Add to wishlist:", product);
    toast.success(`${product.name} added to wishlist!`);
  };

  return (
    <>
      <Helmet>
        <title>Marketplace - Your One-Stop Shopping Destination</title>
        <meta
          name="description"
          content="Discover amazing products from trusted vendors worldwide. Shop electronics, fashion, home goods, and more."
        />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover Amazing Products
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                From trusted vendors worldwide
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <SearchBar
                  variant="hero"
                  placeholder="Search for products, brands, and more..."
                  showSuggestions={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        {categories && categories.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">
                Shop by Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category._id}
                    to={`/products?category=${category._id}`}
                    className="group text-center p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                      <span className="text-2xl font-bold text-primary-600">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <Link
                to="/products"
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View all products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts?.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 group"
                  >
                    <div className="relative">
                      <img
                        src={
                          product.images?.[0]?.url || "/placeholder-product.jpg"
                        }
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                          <Heart className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleQuickView(product)}
                          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i <
                                Math.floor(product.stats?.rating?.average || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Why Choose Our Marketplace?
              </h2>
              <p className="text-lg text-gray-600">
                We provide the best shopping experience with trusted vendors and
                quality products
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
                <p className="text-gray-600">
                  Your data and payments are protected with industry-standard
                  security measures.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Quick and reliable shipping from vendors worldwide to your
                  doorstep.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600">
                  Carefully curated products from verified vendors with customer
                  reviews.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
