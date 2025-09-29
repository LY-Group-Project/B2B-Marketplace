import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['adminProducts', { search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder }],
    queryFn: () => adminAPI.getAllProducts({ 
      search: searchTerm, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      sortBy,
      sortOrder
    }),
    select: (response) => response.data,
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminAPI.getCategories(),
    select: (response) => response.data,
  });

  // Update product status mutation
  const updateProductStatusMutation = useMutation({
    mutationFn: ({ productId, status }) => adminAPI.updateProductStatus(productId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Product status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product status');
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId) => adminAPI.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const categories = categoriesData?.categories || [];

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStatusChange = (productId, newStatus) => {
    updateProductStatusMutation.mutate({ productId, status: newStatus });
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
      default:
        return <CubeIcon className="h-4 w-4 text-gray-500" />;
    }
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
        <title>Product Management - Admin Dashboard</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="mt-2 text-gray-600">Manage all products and vendor submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CubeIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <CheckIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <XMarkIcon className="h-12 w-12 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
              
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low to High</option>
                <option value="price-desc">Price High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.vendor?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{product.vendor?.email}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          ${product.price?.toFixed(2)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.quantity || 0}
                          {product.quantity < 10 && (
                            <span className="ml-2 text-red-500 text-xs">Low Stock</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(product.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {product.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(product._id, 'active')}
                                className="text-green-600 hover:text-green-900"
                                disabled={updateProductStatusMutation.isPending}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(product._id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                disabled={updateProductStatusMutation.isPending}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteProductMutation.isPending}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Images */}
              <div>
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden mb-4">
                  <img
                    src={selectedProduct.images?.[0] || '/placeholder-product.jpg'}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedProduct.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProduct.name} ${index + 2}`}
                        className="w-full h-16 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-gray-600 mt-2">{selectedProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="text-lg font-bold text-green-600">${selectedProduct.price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{selectedProduct.category?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <p className="text-sm text-gray-900">{selectedProduct.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <p className="text-sm text-gray-900">{selectedProduct.vendor?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedProduct.status)}`}>
                      {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {selectedProduct.specifications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                    <div className="text-sm text-gray-900 whitespace-pre-line">
                      {selectedProduct.specifications}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              {selectedProduct.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedProduct._id, 'active');
                      setShowProductModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedProduct._id, 'rejected');
                      setShowProductModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProducts;

