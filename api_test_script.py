
import requests
import json

# --- Configuration ---
# Make sure your API server is running and accessible at this URL.
# This should match the NEXT_PUBLIC_API_URL in your .env file.
BASE_URL = "https://apis.trustedvehicles.com"

HEADERS = {
    'Content-Type': 'application/json'
}

# --- Test Functions ---

def test_loan_request():
    """Tests the /api/loan-requests endpoint."""
    print("\n--- Testing Loan Request API ---")
    url = f"{BASE_URL}/api/loan-requests"
    payload = {
        "name": "Test Borrower",
        "phone": "9876543210",
        "email": "borrower@example.com",
        "make": "Test Make",
        "model": "Test Model",
        "variant": "LXI",
        "panNumber": "ABCDE1234F",
        "aadharNumber": "123456789012"
    }
    
    try:
        response = requests.post(url, headers=HEADERS, data=json.dumps(payload), timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def test_insurance_renewal():
    """Tests the /api/insurance-renewals endpoint."""
    print("\n--- Testing Insurance Renewal API ---")
    url = f"{BASE_URL}/api/insurance-renewals"
    payload = {
        "name": "Test PolicyHolder",
        "phone": "8765432109",
        "registrationNumber": "MH12XY1234",
        "insuranceType": "Comprehensive"
    }

    try:
        response = requests.post(url, headers=HEADERS, data=json.dumps(payload), timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

def test_pdi_inspection():
    """Tests the /api/pdi-inspections endpoint."""
    print("\n--- Testing PDI Inspection API ---")
    url = f"{BASE_URL}/api/pdi-inspections"
    payload = {
        "name": "Test PDI Customer",
        "phone": "7654321098",
        "email": "pdi.customer@example.com",
        "city": "Test City",
        "make": "Test Vehicle Make",
        "model": "Test Vehicle Model"
    }
    
    try:
        response = requests.post(url, headers=HEADERS, data=json.dumps(payload), timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")


# --- Main Execution ---

if __name__ == "__main__":
    print(f"Starting API tests for base URL: {BASE_URL}")
    test_loan_request()
    test_insurance_renewal()
    test_pdi_inspection()
    print("\n--- All tests completed. ---\n")
