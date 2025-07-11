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
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';

function Inventory() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    category: '',
    image: null,
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await productService.getProducts(user.id);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    await fetchProducts(true);
  };

  const formatCurrency = (amount) => {
    return '₵' + new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      quantity: '',
      category: '',
      image: null,
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category || '',
      image: product.image_url ? { uri: product.image_url } : null,
    });
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      let imageUrl = '';
      if (formData.image && formData.image.uri) {
        // For now, we'll store the image URI directly
        // In a real app, you'd upload to a cloud service
        imageUrl = formData.image.uri;
      }

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        image_url: imageUrl,
        user_id: user.id,
      };

      if (editingProduct) {
        // Update existing product
        await productService.updateProduct(editingProduct.id, productData);
        await fetchProducts(); // Refresh the list
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Add new product
        await productService.createProduct(productData);
        await fetchProducts(); // Refresh the list
        Alert.alert('Success', 'Product added successfully');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0] });
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(productId);
              await fetchProducts(); // Refresh the list
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Header 
          title="Inventory"
          subtitle="Manage your products"
          rightIcon="add"
          onRightPress={handleAddProduct}
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

  const lowStockProducts = products.filter(p => p.quantity <= 10);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="Inventory"
        subtitle="Manage your products"
        rightIcon="add"
        onRightPress={handleAddProduct}
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
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Products</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{products.length}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Value</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(totalValue)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Low Stock</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {lowStockProducts.length}
            </Text>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Ionicons name="warning" size={24} color="#dc2626" />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>Low Stock Alert</Text>
                <Text style={styles.alertMessage}>
                  {lowStockProducts.length} products need restocking
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Products List */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Products</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first product to start managing your inventory
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: theme.card }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>

                  <View style={styles.productDetails}>
                    <Text style={[styles.productPrice, { color: theme.primary }]}>{formatCurrency(product.price)}</Text>
                    <Text style={[
                      styles.productQuantity,
                      product.quantity <= 10 && styles.lowStock,
                      { color: theme.secondaryText }
                    ]}>
                      Qty: {product.quantity}
                    </Text>
                  </View>
                  {product.category && (
                    <Text style={[styles.productCategory, { color: theme.secondaryText }]}>{product.category}</Text>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Ionicons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProduct(product.id)}
                  >
                    <Ionicons name="trash" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.formContainer}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.formContent}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Product Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter product name"
                />
              </View>



              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Price (₵) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Quantity in Stock *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="e.g., Electronics, Clothing, Food"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Product Image</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  {formData.image ? (
                    <Image source={formData.image} style={styles.productImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#6b7280" />
                      <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Text>
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
  alertCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#b91c1c',
  },
  productsSection: {
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
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  productQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  lowStock: {
    color: '#dc2626',
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
    minHeight: '60%',
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
  formContainer: {
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

  saveButton: {
    backgroundColor: '#ec4899',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerButton: {
    marginTop: 8,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f9fafb',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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

export default Inventory; 