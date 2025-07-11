import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { salesService, productService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/dateUtils';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';

function Sales() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    product_id: '',
    quantity: '',
    price: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Fetch all data in parallel
      const [salesData, productsData] = await Promise.all([
        salesService.getSales(user.id),
        productService.getProducts(user.id),
      ]);

      setSales(salesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    await fetchData(true);
  };

  const formatCurrency = (amount) => {
    return '₵' + new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleAddSale = () => {
    setFormData({
      customer_name: '',
      product_id: '',
      quantity: '',
      price: '',
      payment_method: 'cash',
    });
    setSelectedProduct(null);
    setSearchTerm('');
    setModalVisible(true);
  };

  const handleProductSelect = (product) => {
    console.log('Selected product:', product); // Debug: see the product structure
    setSelectedProduct(product);
    setFormData({
      ...formData,
      product_id: (product.int_id || product.id).toString(),
      price: product.price.toString(),
      quantity: '',
    });
  };

  const handleQuantityChange = (quantity) => {
    if (selectedProduct) {
      const total = quantity * selectedProduct.price;
      setFormData({
        ...formData,
        quantity: quantity,
      });
    }
  };

  const handleSaveSale = async () => {
    if (!formData.customer_name || !selectedProduct || !formData.quantity || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(formData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (parseInt(formData.quantity) > selectedProduct.quantity) {
      Alert.alert('Error', `Insufficient stock. Only ${selectedProduct.quantity} units available.`);
      return;
    }

    try {
      console.log('Selected product for sale:', selectedProduct); // Debug: see what we're sending
      const saleData = {
        customer_name: formData.customer_name.trim(),
        product_id: parseInt(formData.product_id),
        product_name: selectedProduct.name,
        quantity_sold: parseInt(formData.quantity),
        unit_price: parseFloat(formData.price),
        total_amount: parseInt(formData.quantity) * parseFloat(formData.price),
        payment_method: formData.payment_method,
        date: new Date().toISOString().split('T')[0],
        user_id: user.id,
      };
      console.log('Sale data being sent:', saleData); // Debug: see what we're sending

      await salesService.createSale(saleData);
      await fetchData(); // Refresh the list
      setModalVisible(false);
      Alert.alert('Success', 'Sale recorded successfully');
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method || 'cash') {
      case 'cash':
        return 'cash';
      case 'mobile_money':
        return 'phone-portrait';
      case 'card':
        return 'card';
      default:
        return 'cash';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method || 'cash') {
      case 'cash':
        return '#22c55e';
      case 'mobile_money':
        return '#3b82f6';
      case 'card':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Header 
          title="Sales"
          subtitle="Track and record sales"
          rightIcon="add"
          onRightPress={handleAddSale}
        />
        <View style={{ padding: 20 }}>
          <View style={{ height: 60, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 60, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 120, borderRadius: 12, backgroundColor: theme.card + '99', marginBottom: 16 }} />
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 32 }} />
        </View>
      </View>
    );
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const todaySales = sales.filter(sale => sale.date === new Date().toISOString().split('T')[0]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="Sales"
        subtitle="Track and record sales"
        rightIcon="add"
        onRightPress={handleAddSale}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ec4899']}
            tintColor="#ec4899"
          />
        }
      >

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Sales</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(totalSales)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Today's Sales</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(todaySales.reduce((sum, sale) => sum + sale.total_amount, 0))}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Transactions</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{sales.length}</Text>
          </View>
        </View>

        {/* Sales List */}
        <View style={styles.salesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Sales</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSale}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>New Sale</Text>
            </TouchableOpacity>
          </View>

          {sales.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Sales Yet</Text>
              <Text style={styles.emptyStateText}>
                Record your first sale to start tracking your business performance
              </Text>
            </View>
          ) : (
            sales.map((sale) => (
              <View key={sale.id} style={[styles.saleCard, { backgroundColor: theme.card }]}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleDate}>
                    {formatDate(sale.date)}
                  </Text>
                  <View style={styles.paymentMethod}>
                    <Ionicons 
                      name={getPaymentMethodIcon(sale.payment_method || 'cash')} 
                      size={16} 
                      color={getPaymentMethodColor(sale.payment_method || 'cash')} 
                    />
                    <Text style={[styles.paymentText, { color: getPaymentMethodColor(sale.payment_method || 'cash') }]}>
                      {(sale.payment_method || 'cash').replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.saleDetails}>
                  <Text style={[styles.customerName, { color: theme.text }]}>{sale.customer_name || 'Walk-in Customer'}</Text>
                  <Text style={[styles.productName, { color: theme.secondaryText }]}>{sale.product_name}</Text>
                  <View style={styles.saleInfo}>
                    <Text style={[styles.quantity, { color: theme.text }]}>Qty: {sale.quantity_sold}</Text>
                    <Text style={[styles.price, { color: theme.text }]}>₵{sale.unit_price}</Text>
                  </View>
                </View>
                
                <View style={styles.saleTotal}>
                  <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                  <Text style={[styles.totalAmount, { color: theme.primary }]}>{formatCurrency(sale.total_amount)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Enhanced Add Sale Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record New Sale</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.formContent}
            >
              {/* Customer Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Customer Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={formData.customer_name}
                  onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                  placeholder="Enter customer name"
                />
              </View>

              {/* Product Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Select Product *</Text>
                
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Search products..."
                  />
                </View>

                {/* Product Grid */}
                <View style={styles.productGrid}>
                  {filteredProducts.length === 0 ? (
                    <View style={styles.emptyProducts}>
                      <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                      <Text style={styles.emptyProductsTitle}>No products found</Text>
                      <Text style={styles.emptyProductsText}>Add products in the Inventory section first</Text>
                    </View>
                  ) : (
                    filteredProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productCard,
                          selectedProduct?.id === product.id && styles.productCardSelected
                        ]}
                        onPress={() => handleProductSelect(product)}
                      >
                        <View style={styles.productRow}>
                          {product.image_url && (
                            <Image
                              source={{ uri: product.image_url }}
                              style={styles.productThumbnail}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.productInfo}>
                            <Text style={[
                              styles.productName,
                              selectedProduct?.id === product.id && styles.productNameSelected
                            ]}>
                              {product.name}
                            </Text>
                            <Text style={[styles.productPrice, { color: theme.primary }]}>{formatCurrency(product.price)}</Text>
                          </View>
                          <View style={styles.productMeta}>
                            <Text style={[styles.productStock, { color: theme.secondaryText }]}>{product.quantity}</Text>
                            {product.quantity <= 5 && (
                              <Ionicons name="warning" size={12} color="#f59e0b" />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Selected Product Summary */}
              {selectedProduct && (
                <View style={[styles.selectedProductCard, { backgroundColor: theme.successBackground }]}>
                  <Text style={[styles.selectedProductTitle, { color: theme.success }]}>Selected Product</Text>
                  <View style={styles.selectedProductInfo}>
                    <View>
                      <Text style={[styles.selectedProductName, { color: theme.success }]}>{selectedProduct.name}</Text>
                      <Text style={[styles.selectedProductCategory, { color: theme.success }]}>{selectedProduct.category}</Text>
                    </View>
                    <View style={styles.selectedProductPricing}>
                      <Text style={[styles.selectedProductPrice, { color: theme.success }]}>{formatCurrency(selectedProduct.price)}</Text>
                      <Text style={[styles.selectedProductStock, { color: theme.success }]}>Available: {selectedProduct.quantity}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Quantity and Price */}
              <View style={styles.quantityPriceRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Quantity *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                    value={formData.quantity}
                    onChangeText={(text) => handleQuantityChange(text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  {selectedProduct && (
                    <Text style={[styles.stockInfo, { color: theme.secondaryText }]}>Available: {selectedProduct.quantity} units</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Unit Price (Fixed)</Text>
                  <TextInput
                    style={[styles.input, styles.disabledInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                    value={selectedProduct ? formatCurrency(selectedProduct.price) : ''}
                    editable={false}
                  />
                </View>
              </View>

              {/* Total Amount */}
              {formData.quantity > 0 && selectedProduct && (
                <View style={[styles.totalAmountCard, { backgroundColor: theme.infoBackground }]}>
                  <Text style={[styles.totalAmountLabel, { color: theme.info }]}>Total Amount:</Text>
                  <Text style={[styles.totalAmountValue, { color: theme.info }]}>
                    {formatCurrency(parseInt(formData.quantity) * selectedProduct.price)}
                  </Text>
                </View>
              )}

              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Payment Method *</Text>
                <View style={styles.paymentMethods}>
                  {['cash', 'mobile_money', 'card'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentOption,
                        formData.payment_method === method && styles.paymentOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, payment_method: method })}
                    >
                      <Ionicons 
                        name={getPaymentMethodIcon(method)} 
                        size={20} 
                        color={formData.payment_method === method ? 'white' : getPaymentMethodColor(method)} 
                      />
                      <Text style={[
                        styles.paymentOptionText,
                        formData.payment_method === method && styles.paymentOptionTextSelected
                      ]}>
                        {method.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    (!selectedProduct || !formData.quantity) && styles.saveButtonDisabled
                  ]} 
                  onPress={handleSaveSale}
                  disabled={!selectedProduct || !formData.quantity}
                >
                  <Text style={styles.saveButtonText}>Record Sale</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  salesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#ec4899',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  saleDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  saleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  price: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    flex: 1,
    marginTop: 10,
  },
  formContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  productGrid: {
    maxHeight: 200,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyProductsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productNameSelected: {
    color: '#ec4899',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  productMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productStock: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedProductCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  selectedProductInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  selectedProductCategory: {
    fontSize: 14,
    color: '#16a34a',
  },
  selectedProductPricing: {
    alignItems: 'flex-end',
  },
  selectedProductPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  selectedProductStock: {
    fontSize: 12,
    color: '#16a34a',
  },
  quantityPriceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stockInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  totalAmountCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  totalAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 4,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  paymentOptionSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  paymentOptionTextSelected: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#ec4899',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
  },
});

export default Sales; 