import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  EyeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => adminAPI.getCategories(),
    select: (response) => response.data,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData) => adminAPI.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      toast.success('Category created successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '', image: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, data }) => adminAPI.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      toast.success('Category updated successfully');
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '', image: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => adminAPI.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  });

  const categories = categoriesData?.categories || [];

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategoryMutation.mutate({
        categoryId: selectedCategory._id,
        data: formData
      });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image: '' });
    setSelectedCategory(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Category Management - Admin Dashboard</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="mt-2 text-gray-600">Manage product categories and organization</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <TagIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <EyeIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.filter(c => !c.isDeleted).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <PhotoIcon className="h-12 w-12 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">With Images</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.filter(c => c.image).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div key={category._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <TagIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Products: {category.productCount || 0}</span>
                    <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-red-600 hover:text-red-900 p-2"
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first category'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending
                    ? 'Saving...'
                    : selectedCategory
                    ? 'Update Category'
                    : 'Create Category'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCategories;

