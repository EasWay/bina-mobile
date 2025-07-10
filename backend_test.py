#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Bina Business Tracker API
Tests all authentication, products, sales, and customers endpoints
"""

import requests
import json
import sys
import os
from datetime import datetime
import base64

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

class BinaAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = {
            "email": "amara.fashion@gmail.com",
            "password": "SecureFashion2024!",
            "full_name": "Amara Okafor"
        }
        self.test_results = []
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "data": data
        })
        
    def test_server_health(self):
        """Test if server is running"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                self.log_test("Server Health Check", True, "Server is running")
                return True
            else:
                self.log_test("Server Health Check", False, f"Server returned {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Server Health Check", False, f"Server not accessible: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        try:
            # First try to register a new user
            response = self.session.post(
                f"{API_BASE}/auth/register",
                json=self.user_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("User Registration", True, "User registered successfully")
                    return True
                else:
                    self.log_test("User Registration", False, "Invalid response format")
                    return False
            elif response.status_code == 400 and "already registered" in response.text:
                # User already exists, try to login instead
                self.log_test("User Registration", True, "User already exists (expected)")
                return self.test_user_login()
            else:
                self.log_test("User Registration", False, f"Registration failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        try:
            login_data = {
                "email": self.user_data["email"],
                "password": self.user_data["password"]
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_test("User Login", True, "Login successful")
                    return True
                else:
                    self.log_test("User Login", False, "Invalid response format")
                    return False
            else:
                self.log_test("User Login", False, f"Login failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data and "full_name" in data:
                    self.log_test("Get Current User", True, f"User info retrieved: {data['full_name']}")
                    return True
                else:
                    self.log_test("Get Current User", False, "Invalid user data format")
                    return False
            else:
                self.log_test("Get Current User", False, f"Failed to get user info: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return False
    
    def test_create_product(self):
        """Test creating a product"""
        if not self.auth_token:
            self.log_test("Create Product", False, "No auth token available")
            return False
            
        try:
            # Sample base64 image (small 1x1 pixel PNG)
            sample_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            product_data = {
                "name": "Ankara Print Dress",
                "price": 15000.0,
                "quantity": 25,
                "category": "Dresses",
                "image_base64": sample_image
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{API_BASE}/products",
                json=product_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == product_data["name"]:
                    self.product_id = data["id"]
                    self.log_test("Create Product", True, f"Product created: {data['name']}")
                    return True
                else:
                    self.log_test("Create Product", False, "Invalid product data format")
                    return False
            else:
                self.log_test("Create Product", False, f"Failed to create product: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Product", False, f"Exception: {str(e)}")
            return False
    
    def test_get_products(self):
        """Test getting all products"""
        if not self.auth_token:
            self.log_test("Get Products", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/products", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Products", True, f"Retrieved {len(data)} products")
                    return True
                else:
                    self.log_test("Get Products", False, "Invalid response format")
                    return False
            else:
                self.log_test("Get Products", False, f"Failed to get products: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Products", False, f"Exception: {str(e)}")
            return False
    
    def test_update_product(self):
        """Test updating a product"""
        if not self.auth_token or not hasattr(self, 'product_id'):
            self.log_test("Update Product", False, "No auth token or product ID available")
            return False
            
        try:
            update_data = {
                "price": 18000.0,
                "quantity": 30
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.put(
                f"{API_BASE}/products/{self.product_id}",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["price"] == update_data["price"]:
                    self.log_test("Update Product", True, f"Product updated: price={data['price']}")
                    return True
                else:
                    self.log_test("Update Product", False, "Product not updated correctly")
                    return False
            else:
                self.log_test("Update Product", False, f"Failed to update product: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Product", False, f"Exception: {str(e)}")
            return False
    
    def test_create_customer(self):
        """Test creating a customer"""
        if not self.auth_token:
            self.log_test("Create Customer", False, "No auth token available")
            return False
            
        try:
            customer_data = {
                "full_name": "Chioma Adebayo",
                "phone_number": "+234-803-123-4567",
                "address": "15 Victoria Island, Lagos, Nigeria",
                "gender": "Female",
                "referral_source": "Instagram"
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{API_BASE}/customers",
                json=customer_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["full_name"] == customer_data["full_name"]:
                    self.customer_id = data["id"]
                    self.log_test("Create Customer", True, f"Customer created: {data['full_name']}")
                    return True
                else:
                    self.log_test("Create Customer", False, "Invalid customer data format")
                    return False
            else:
                self.log_test("Create Customer", False, f"Failed to create customer: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Customer", False, f"Exception: {str(e)}")
            return False
    
    def test_create_sale(self):
        """Test creating a sale and inventory reduction"""
        if not self.auth_token or not hasattr(self, 'product_id'):
            self.log_test("Create Sale", False, "No auth token or product ID available")
            return False
            
        try:
            sale_data = {
                "product_id": self.product_id,
                "quantity_sold": 3,
                "unit_price": 18000.0,
                "customer_id": getattr(self, 'customer_id', None)
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{API_BASE}/sales",
                json=sale_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_total = sale_data["quantity_sold"] * sale_data["unit_price"]
                if data["total_amount"] == expected_total:
                    self.log_test("Create Sale", True, f"Sale created: ₦{data['total_amount']}")
                    return True
                else:
                    self.log_test("Create Sale", False, "Sale calculation incorrect")
                    return False
            else:
                self.log_test("Create Sale", False, f"Failed to create sale: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Sale", False, f"Exception: {str(e)}")
            return False
    
    def test_sales_analytics(self):
        """Test sales analytics endpoint"""
        if not self.auth_token:
            self.log_test("Sales Analytics", False, "No auth token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/sales/analytics", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_sales", "sales_by_date", "top_products", "total_orders"]
                if all(field in data for field in required_fields):
                    self.log_test("Sales Analytics", True, f"Analytics retrieved: ₦{data['total_sales']} total sales")
                    return True
                else:
                    self.log_test("Sales Analytics", False, "Missing required analytics fields")
                    return False
            else:
                self.log_test("Sales Analytics", False, f"Failed to get analytics: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Analytics", False, f"Exception: {str(e)}")
            return False
    
    def test_inventory_reduction(self):
        """Test that inventory was reduced after sale"""
        if not self.auth_token or not hasattr(self, 'product_id'):
            self.log_test("Inventory Reduction", False, "No auth token or product ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(f"{API_BASE}/products", headers=headers)
            
            if response.status_code == 200:
                products = response.json()
                product = next((p for p in products if p["id"] == self.product_id), None)
                
                if product:
                    # Original quantity was 30 (after update), sold 3, should be 27
                    expected_quantity = 27
                    if product["quantity"] == expected_quantity:
                        self.log_test("Inventory Reduction", True, f"Inventory correctly reduced to {product['quantity']}")
                        return True
                    else:
                        self.log_test("Inventory Reduction", False, f"Expected {expected_quantity}, got {product['quantity']}")
                        return False
                else:
                    self.log_test("Inventory Reduction", False, "Product not found")
                    return False
            else:
                self.log_test("Inventory Reduction", False, f"Failed to get products: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Inventory Reduction", False, f"Exception: {str(e)}")
            return False
    
    def test_authentication_protection(self):
        """Test that endpoints are protected without authentication"""
        try:
            # Test accessing protected endpoint without token
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 401:
                self.log_test("Authentication Protection", True, "Endpoints properly protected")
                return True
            else:
                self.log_test("Authentication Protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Protection", False, f"Exception: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling for invalid data"""
        if not self.auth_token:
            self.log_test("Error Handling", False, "No auth token available")
            return False
            
        try:
            # Test creating product with invalid data
            invalid_product = {
                "name": "",  # Empty name
                "price": -100,  # Negative price
                "quantity": -5,  # Negative quantity
                "category": ""
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{API_BASE}/products",
                json=invalid_product,
                headers=headers
            )
            
            # Should return 422 for validation error or 400 for bad request
            if response.status_code in [400, 422]:
                self.log_test("Error Handling", True, "Invalid data properly rejected")
                return True
            else:
                self.log_test("Error Handling", False, f"Expected 400/422, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Exception: {str(e)}")
            return False
    
    def test_insufficient_stock(self):
        """Test insufficient stock handling"""
        if not self.auth_token or not hasattr(self, 'product_id'):
            self.log_test("Insufficient Stock", False, "No auth token or product ID available")
            return False
            
        try:
            # Try to sell more than available stock
            sale_data = {
                "product_id": self.product_id,
                "quantity_sold": 1000,  # More than available
                "unit_price": 18000.0
            }
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{API_BASE}/sales",
                json=sale_data,
                headers=headers
            )
            
            if response.status_code == 400 and "Insufficient stock" in response.text:
                self.log_test("Insufficient Stock", True, "Insufficient stock properly handled")
                return True
            else:
                self.log_test("Insufficient Stock", False, f"Expected 400 with stock error, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Insufficient Stock", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Bina Business Tracker Backend API Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Core functionality tests
        tests = [
            self.test_server_health,
            self.test_authentication_protection,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_create_product,
            self.test_get_products,
            self.test_update_product,
            self.test_create_customer,
            self.test_create_sale,
            self.test_inventory_reduction,
            self.test_sales_analytics,
            self.test_error_handling,
            self.test_insufficient_stock
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {str(e)}")
                failed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = BinaAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()