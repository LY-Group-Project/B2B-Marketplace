import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, cartAPI, reviewsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import {
  StarIcon,
  HeartIcon,
  ShareIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch product details
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getProduct(id),
    select: (response) => {
      console.log('Product data received:', response.data);
      console.log('Images in product:', response.data?.images);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch related products
  const { data: relatedProductsData } = useQuery({
    queryKey: ['relatedProducts', id],
    queryFn: () => productsAPI.getRelatedProducts(id),
    select: (response) => response.data,
    enabled: !!id,
  });

  // Fetch product reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['productReviews', id],
    queryFn: () => reviewsAPI.getProductReviews(id),
    select: (response) => response.data,
    enabled: !!id,
  });

  const product = productData;
  const relatedProducts = relatedProductsData?.products || [];
  const reviews = reviewsData?.reviews || [];

  // Test image loading on component mount
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const testImageUrl = getImageUrl(product.images[0]);
      console.log('Testing image URL:', testImageUrl);
      
      // Test with fetch
      fetch(testImageUrl, { mode: 'no-cors' })
        .then(() => {
          console.log('Image fetch successful (no-cors)');
        })
        .catch(error => {
          console.error('Image fetch failed:', error);
        });
        
      // Test with Image object
      const testImg = new Image();
      testImg.onload = () => {
        console.log('Image object load successful');
      };
      testImg.onerror = (error) => {
        console.error('Image object load failed:', error);
      };
      testImg.src = testImageUrl;
    }
  }, [product]);

  // Handle quantity changes
  const increaseQuantity = () => {
    if (quantity < product?.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product) return;

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || product.images?.[0] || '',
      vendor: product.vendor,
      quantity: quantity,
      maxQuantity: product.quantity,
    };

    addItem(cartItem);
    toast.success(`${product.name} added to cart`);
  };

  // Buy now
  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to make a purchase');
      navigate('/login');
      return;
    }

    handleAddToCart();
    navigate('/cart');
  };

  // Share product
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard');
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Handle image navigation
  const nextImage = () => {
    if (product?.images && selectedImageIndex < product.images.length - 1) {
      setSelectedImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(prev => prev - 1);
    }
  };

  // Get image URL
  const getImageUrl = (image) => {
    console.log('getImageUrl called with:', image);
    if (typeof image === 'string') return image;
    const url = image?.url || '';
    console.log('Extracted URL:', url);
    
    // For localhost development, ensure we're using the correct protocol and port
    if (url && url.includes('localhost:5000')) {
      // Ensure we're using http:// and the full localhost URL
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const finalUrl = `http://${cleanUrl}`;
      console.log('Final URL:', finalUrl);
      return finalUrl;
    }
    
    return url;
  };

  // console.log(getImageUrl(image));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - B2B Marketplace</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-blue-600">Products</Link>
            <span>/</span>
            <Link to={`/categories/${product.category?.slug}`} className="hover:text-blue-600">
              {product.category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden aspect-square">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(product.images[selectedImageIndex])}
                      alt={product.name}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setShowImageModal(true)}
                      onError={(e) => {
                        const imageUrl = getImageUrl(product.images[selectedImageIndex]);
                        console.error('Image failed to load:', imageUrl);
                        console.error('Image error event:', e);
                        
                        // Don't use fallback SVG, let's try a different approach
                        // Instead of setting a fallback, let's just log and keep the original URL
                        console.log('Keeping original src for debugging');
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', getImageUrl(product.images[selectedImageIndex]));
                      }}
                    />
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={selectedImageIndex === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={selectedImageIndex === product.images.length - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Thumbnail image failed to load:', getImageUrl(image));
                          // Don't use fallback, keep original for debugging
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      ${product.comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.comparePrice && product.comparePrice > product.price && (
                  <div className="text-sm text-green-600">
                    Save ${(product.comparePrice - product.price).toFixed(2)} 
                    ({Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% off)
                  </div>
                )}
              </div>

              {/* Vendor Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sold by</p>
                    <p className="font-semibold text-gray-900">
                      {product.vendor?.vendorProfile?.businessName || product.vendor?.name}
                    </p>
                  </div>
                  <Link
                    to={`/vendors/${product.vendor?._id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Store
                  </Link>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {product.quantity > 0 ? (
                  <>
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-medium">
                      In Stock ({product.quantity} available)
                    </span>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              {product.quantity > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        disabled={quantity >= product.quantity}
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.quantity === 0}
                    className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center"
                  >
                    {isWishlisted ? (
                      <HeartIconSolid className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-2" />
                    )}
                    Wishlist
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center"
                  >
                    <ShareIcon className="h-5 w-5 mr-2" />
                    Share
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">30-day return policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['description', 'specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      selectedTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab} {tab === 'reviews' && `(${reviews.length})`}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'specifications' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Weight</span>
                        <span className="text-gray-600">{product.weight} kg</span>
                      </div>
                    )}
                    
                    {product.dimensions && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Dimensions</span>
                        <span className="text-gray-600">
                          {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Category</span>
                      <span className="text-gray-600">{product.category?.name}</span>
                    </div>
                    
                    {product.sku && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">SKU</span>
                        <span className="text-gray-600">{product.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'reviews' && (
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    <>
                      {/* Reviews Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < Math.floor(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Individual Reviews */}
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review._id} className="border-b border-gray-100 pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-gray-900">
                                    {review.user?.name || 'Anonymous'}
                                  </span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet. Be the first to write a review!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <Link
                    key={relatedProduct._id}
                    to={`/products/${relatedProduct._id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-100">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img
                          src={getImageUrl(relatedProduct.images[0])}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Related product image failed to load:', getImageUrl(relatedProduct.images[0]));
                            // Keep original for debugging
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-lg font-bold text-gray-900">
                        ${relatedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {showImageModal && product.images && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-full p-4">
              <img
                src={getImageUrl(product.images[selectedImageIndex])}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Modal image failed to load:', getImageUrl(product.images[selectedImageIndex]));
                  // Keep original for debugging
                }}
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetail;

