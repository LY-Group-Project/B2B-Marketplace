import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

const Cart = () => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();

  const handleQuantityChange = (productId, variant, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId, variant);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(productId, newQuantity, variant);
    }
  };

  const handleRemoveItem = (productId, variant) => {
    removeItem(productId, variant);
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  if (items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Cart - Marketplace</title>
          <meta name="description" content="Your shopping cart" />
        </Helmet>

        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-lg text-gray-500 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cart - Marketplace</title>
        <meta name="description" content="Your shopping cart" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-500 mt-2">{itemCount} item(s) in your cart</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Cart Items</h2>
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <div key={`${item.product._id}-${JSON.stringify(item.variant)}`} className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            className="h-20 w-20 object-cover rounded-md"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              {item.variant.name}: {item.variant.option}
                            </p>
                          )}
                          <p className="text-lg font-semibold text-primary-600">
                            ${item.product.price}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(
                              item.product._id,
                              item.variant,
                              item.quantity - 1
                            )}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-500" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(
                              item.product._id,
                              item.variant,
                              item.quantity + 1
                            )}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.product._id, item.variant)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${(total * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 transition-colors text-center block"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/products"
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors text-center block"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;

