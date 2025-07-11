import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { salesService, productService, customerService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import { getTimeBasedGreeting } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

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
      const [analyticsData, productsData, customersData] = await Promise.all([
        salesService.getSalesAnalytics(user.id),
        productService.getProducts(user.id),
        customerService.getCustomers(user.id),
      ]);

      setAnalytics(analyticsData);
      setProducts(productsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
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

  const chartData = {
    labels: analytics?.sales_by_date ? Object.keys(analytics.sales_by_date).slice(-7) : [],
    datasets: [
      {
        data: analytics?.sales_by_date ? Object.values(analytics.sales_by_date).slice(-7) : [],
        color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Header 
          title="Dashboard"
          subtitle={getTimeBasedGreeting()}
          rightIcon="notifications-outline"
          onRightPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
        />
        <View style={{ padding: 20 }}>
          <View style={{ height: 80, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 80, borderRadius: 12, backgroundColor: theme.card + 'CC', marginBottom: 16 }} />
          <View style={{ height: 220, borderRadius: 12, backgroundColor: theme.card + '99', marginBottom: 16 }} />
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 32 }} />
        </View>
      </View>
    );
  }

  const lowStockProducts = products.filter(p => p.quantity <= 10);
  const newCustomersThisMonth = customers.filter(c => {
    const customerDate = new Date(c.created_at);
    const now = new Date();
    return customerDate.getMonth() === now.getMonth() && 
           customerDate.getFullYear() === now.getFullYear();
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="Dashboard"
        subtitle={getTimeBasedGreeting()}
        rightIcon="notifications-outline"
        onRightPress={() => Alert.alert('Notifications', 'Notifications coming soon!')}
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

      {/* Business Summary */}
              <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Business Summary</Text>
          <View style={styles.summaryGrid}>
            {/* Sales */}
            <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
              <View style={styles.summaryContent}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Sales</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {formatCurrency(analytics?.total_sales || 0)}
                  </Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                  <Ionicons name="trending-up" size={24} color="#ec4899" />
                </View>
              </View>
            </View>

            {/* Products */}
            <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
              <View style={styles.summaryContent}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Products</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{products.length}</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                  <Ionicons name="cube" size={24} color="#3b82f6" />
                </View>
              </View>
            </View>
          </View>
          
          {/* Customers - Extended Width */}
          <View style={[styles.extendedCustomerCard, { backgroundColor: theme.card }]}>
            <View style={styles.summaryContent}>
              <View style={styles.customerInfo}>
                <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Customers</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{customers.length}</Text>
                <Text style={[styles.summarySubtext, { color: theme.secondaryText }]}>
                  New: {newCustomersThisMonth.length} | ♀ {customers.filter(c => c.gender === 'female').length} ♂ {customers.filter(c => c.gender === 'male').length}
                </Text>
              </View>
              <View style={[styles.extendedIconContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="people" size={28} color="#22c55e" />
              </View>
            </View>
          </View>
        </View>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={[styles.alertCard, { backgroundColor: theme.danger + '22', borderColor: theme.danger }]}>
          <View style={styles.alertContent}>
            <Ionicons name="warning" size={24} color="#dc2626" />
            <View style={styles.alertText}>
              <Text style={[styles.alertTitle, { color: theme.danger }]}>Low Stock Alert</Text>
              <Text style={[styles.alertMessage, { color: theme.danger }]}>
                {lowStockProducts.length} products are running low on stock
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Sales Trends */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sales Trends</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ec4899',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Top Products */}
      {analytics?.top_products && analytics.top_products.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Products</Text>
          {analytics.top_products.slice(0, 3).map((product, index) => (
            <View key={index} style={[styles.productCard, { backgroundColor: theme.card }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>{product.product_name}</Text>
                <Text style={[styles.productStats, { color: theme.secondaryText }]}>
                  {product.quantity_sold} units sold • {formatCurrency(product.total_revenue)}
                </Text>
              </View>
              <View style={[styles.productRank, { backgroundColor: theme.accent }]}>
                <Text style={[styles.rankText, { color: theme.white }]}>#{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
        </ScrollView>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  extendedCustomerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  extendedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 16,
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
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  productRank: {
    backgroundColor: '#ec4899',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Dashboard; 