import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Categories = () => {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories(),
    select: (response) => response.data,
  });

  const categories = categoriesData || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Categories - Marketplace</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">Browse products by category</p>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center"
                >
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm">
                      {category.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600">
                Categories will appear here once they are added.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Categories;