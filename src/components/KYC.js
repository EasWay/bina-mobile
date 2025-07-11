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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';

function KYC() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    date_of_birth: '',
    address: '',
    id_type: '',
    id_number: '',
    occupation: '',
    income_range: '',
  });

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers(user.id);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      gender: '',
      date_of_birth: '',
      address: '',
      id_type: '',
      id_number: '',
      occupation: '',
      income_range: '',
    });
    setModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      gender: customer.gender || '',
      date_of_birth: customer.date_of_birth || '',
      address: customer.address || '',
      id_type: customer.id_type || '',
      id_number: customer.id_number || '',
      occupation: customer.occupation || '',
      income_range: customer.income_range || '',
    });
    setModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        id_type: formData.id_type,
        id_number: formData.id_number,
        occupation: formData.occupation,
        income_range: formData.income_range,
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Header 
          title="KYC"
          subtitle="Manage customer verification"
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

  const verifiedCustomers = customers.filter(c => c.status === 'verified');
  const pendingCustomers = customers.filter(c => c.status === 'pending');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="KYC"
        subtitle="Manage customer verification"
        rightIcon="add"
        onRightPress={handleAddCustomer}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={styles.summaryLabel}>Total Customers</Text>
            <Text style={styles.summaryValue}>{customers.length}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={styles.summaryLabel}>Verified</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>
              {verifiedCustomers.length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
              {pendingCustomers.length}
            </Text>
          </View>
        </View>

        {/* Customers List */}
        <View style={styles.customersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Records</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </View>

          {customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Customers Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first customer to start managing KYC records
              </Text>
            </View>
          ) : (
            customers.map((customer) => (
              <View key={customer.id} style={[styles.customerCard, { backgroundColor: theme.card }]}>
                <View style={styles.customerHeader}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <View style={styles.statusContainer}>
                    <Ionicons 
                      name={getStatusIcon(customer.status)} 
                      size={16} 
                      color={getStatusColor(customer.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(customer.status) }]}>
                      {customer.status ? customer.status.toUpperCase() : 'PENDING'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.customerDetails}>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                  {customer.email && (
                    <Text style={styles.customerEmail}>{customer.email}</Text>
                  )}
                  <Text style={styles.customerInfo}>
                    {customer.gender} • {customer.occupation || 'Not specified'}
                  </Text>
                  {customer.address && (
                    <Text style={styles.customerAddress}>{customer.address}</Text>
                  )}
                </View>
                
                <View style={styles.customerActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditCustomer(customer)}
                  >
                    <Ionicons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('View Details', `ID: ${customer.id_number || 'Not provided'}\nType: ${customer.id_type || 'Not specified'}`)}
                  >
                    <Ionicons name="eye" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
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
              <Text style={styles.modalTitle}>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['male', 'female'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderOption,
                        formData.gender === gender && styles.genderOptionSelected,
                        { backgroundColor: theme.inputBackground, borderColor: theme.border }
                      ]}
                      onPress={() => setFormData({ ...formData, gender })}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        formData.gender === gender && styles.genderOptionTextSelected,
                        { color: theme.text }
                      ]}>
                        {gender.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.date_of_birth}
                  onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground }]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID Type</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  {['ghana_card', 'passport', 'drivers_license', 'voter_id'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.pickerOption,
                        formData.id_type === type && styles.pickerOptionSelected,
                        { borderBottomColor: theme.border }
                      ]}
                      onPress={() => setFormData({ ...formData, id_type: type })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.id_type === type && styles.pickerOptionTextSelected,
                        { color: theme.text }
                      ]}>
                        {type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.id_number}
                  onChangeText={(text) => setFormData({ ...formData, id_number: text })}
                  placeholder="Enter ID number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Occupation</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground }]}
                  value={formData.occupation}
                  onChangeText={(text) => setFormData({ ...formData, occupation: text })}
                  placeholder="Enter occupation"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Income Range</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  {['0-10000', '10000-30000', '30000-50000', '50000-100000', '100000+'].map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.pickerOption,
                        formData.income_range === range && styles.pickerOptionSelected,
                        { borderBottomColor: theme.border }
                      ]}
                      onPress={() => setFormData({ ...formData, income_range: range })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.income_range === range && styles.pickerOptionTextSelected,
                        { color: theme.text }
                      ]}>
                        ₵{range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveCustomer}>
                <Text style={[styles.saveButtonText, { color: theme.text }]}>
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Text>
              </TouchableOpacity>
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
  customersSection: {
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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  customerDetails: {
    marginBottom: 12,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    maxHeight: '80%',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderOptionSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: {
    backgroundColor: '#fdf2f8',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#ec4899',
    fontWeight: '600',
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
});

export default KYC; 