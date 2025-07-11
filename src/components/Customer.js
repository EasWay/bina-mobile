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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';

function Customer() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    gender: '',
    referral_source: '',
  });

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await customerService.getCustomers(user.id);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    await fetchCustomers(true);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      phone_number: '',
      address: '',
      gender: '',
      referral_source: '',
    });
    setModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name || customer.name || '',
      phone_number: customer.phone_number || customer.phone || '',
      address: customer.address || '',
      gender: customer.gender || '',
      referral_source: customer.referral_source || '',
    });
    setModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.full_name) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    try {
      const customerData = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        address: formData.address,
        gender: formData.gender,
        referral_source: formData.referral_source,
        user_id: user.id,
      };

      if (editingCustomer) {
        // Update existing customer
        await customerService.updateCustomer(editingCustomer.id, customerData);
        await fetchCustomers(); // Refresh the list
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        // Add new customer
        await customerService.createCustomer(customerData);
        await fetchCustomers(); // Refresh the list
        Alert.alert('Success', 'Customer added successfully');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = (customerId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerService.deleteCustomer(customerId);
              await fetchCustomers(); // Refresh the list
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
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
          title="Customers"
          subtitle="Manage your customers"
          rightIcon="add"
          onRightPress={handleAddCustomer}
        />
        <View style={{ padding: 20 }}>
          <View style={{ height: 60, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 60, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 80, borderRadius: 12, backgroundColor: theme.card + '99', marginBottom: 16 }} />
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 32 }} />
        </View>
      </View>
    );
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.email || c.phone).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="Customers"
        subtitle="Manage your customers"
        rightIcon="add"
        onRightPress={handleAddCustomer}
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
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Customers</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalCustomers}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Active Customers</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{activeCustomers}</Text>
          </View>
        </View>

        {/* Customers List */}
        <View style={styles.customersSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Customers</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </View>

          {customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Customers Yet</Text>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Add your first customer to start building your customer database
              </Text>
            </View>
          ) : (
            customers.map((customer) => (
              <View key={customer.id} style={[styles.customerCard, { backgroundColor: theme.card }]}>
                <View style={styles.customerHeader}>
                  <Text style={[styles.customerName, { color: theme.text }]}>{customer.full_name || customer.name}</Text>
                  <View style={styles.customerActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditCustomer(customer)}
                    >
                      <Ionicons name="create-outline" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteCustomer(customer.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
                

                
                {(customer.phone_number || customer.phone) && (
                  <View style={styles.customerInfo}>
                    <Ionicons name="call-outline" size={14} color="#6b7280" />
                    <Text style={[styles.customerInfoText, { color: theme.primary }]}>{customer.phone_number || customer.phone}</Text>
                  </View>
                )}
                
                {customer.address && (
                  <View style={styles.customerInfo}>
                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                    <Text style={[styles.customerInfoText, { color: theme.secondaryText }]}>{customer.address}</Text>
                  </View>
                )}
                
                {customer.gender && (
                  <View style={styles.customerInfo}>
                    <Ionicons name="person-outline" size={14} color="#6b7280" />
                    <Text style={[styles.customerInfoText, { color: theme.secondaryText }]}>Gender: {customer.gender}</Text>
                  </View>
                )}
                
                {customer.referral_source && (
                  <View style={styles.customerInfo}>
                    <Ionicons name="share-outline" size={14} color="#6b7280" />
                    <Text style={[styles.customerInfoText, { color: theme.secondaryText }]}>Referred by: {customer.referral_source}</Text>
                  </View>
                )}
                

              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Customer Modal */}
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
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Enter customer's full name"
                  placeholderTextColor={theme.secondaryText}
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.secondaryText}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                  keyboardType="phone-pad"
                />
              </View>
              

              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Enter customer's address"
                  placeholderTextColor={theme.secondaryText}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                <View style={styles.pickerContainer}>
                  {['female', 'male', 'other'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.pickerOption,
                        formData.gender === gender && styles.pickerOptionSelected,
                        { backgroundColor: theme.inputBackground }
                      ]}
                      onPress={() => setFormData({ ...formData, gender })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.gender === gender && styles.pickerOptionTextSelected,
                        { color: theme.textSecondary }
                      ]}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>How did you hear about us?</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="e.g., Social media, Friend, Advertisement"
                  placeholderTextColor={theme.secondaryText}
                  value={formData.referral_source}
                  onChangeText={(text) => setFormData({ ...formData, referral_source: text })}
                />
              </View>
              

            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveCustomer}
              >
                <Text style={[styles.saveButtonText, { color: 'white' }]}>
                  {editingCustomer ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
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
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customersSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  customerCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
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
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#ec4899',
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});

export default Customer; 