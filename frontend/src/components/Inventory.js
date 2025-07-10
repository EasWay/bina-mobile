import React, { useState, useEffect } from 'react';
import { productService, salesService } from '../services/authService';
import { Search, Filter, Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    category: '',
    image_base64: ''
  });

  const [saleData, setSaleData] = useState({
    product_id: '',
    quantity_sold: '',
    unit_price: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, image_base64: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const newProduct = await productService.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      });
      setProducts([...products, newProduct]);
      setFormData({ name: '', price: '', quantity: '', category: '', image_base64: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleSale = async (e) => {
    e.preventDefault();
    try {
      await salesService.createSale({
        ...saleData,
        quantity_sold: parseInt(saleData.quantity_sold),
        unit_price: parseFloat(saleData.unit_price)
      });
      setSaleData({ product_id: '', quantity_sold: '', unit_price: '' });
      setShowSaleForm(false);
      fetchProducts(); // Refresh to update quantities
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];
  const lowStockProducts = products.filter(p => p.quantity <= 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 input-field"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card p-4 mb-6 bg-rose-50 border-rose-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="font-semibold text-rose-800">Low Stock Alert</h3>
                <p className="text-sm text-rose-700">
                  {lowStockProducts.length} products are running low on stock
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className={`card p-6 ${product.quantity <= 10 ? 'low-stock' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSaleData({ ...saleData, product_id: product.id, unit_price: product.price });
                      setShowSaleForm(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {product.image_base64 && (
                <img 
                  src={product.image_base64} 
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Price</p>
                  <p className="font-semibold">${product.price}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock</p>
                  <p className={`font-semibold ${product.quantity <= 10 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {product.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold">${(product.price * product.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="input-field"
              />
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 btn-primary">Add Product</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Sale</h2>
            <form onSubmit={handleSale} className="space-y-4">
              <input
                type="number"
                placeholder="Quantity Sold"
                value={saleData.quantity_sold}
                onChange={(e) => setSaleData({ ...saleData, quantity_sold: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Unit Price"
                value={saleData.unit_price}
                onChange={(e) => setSaleData({ ...saleData, unit_price: e.target.value })}
                className="input-field"
                required
              />
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 btn-primary">Record Sale</button>
                <button 
                  type="button" 
                  onClick={() => setShowSaleForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;