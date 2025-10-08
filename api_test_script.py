
import requests
import os
from typing import List, Dict, Any

# --- Configuration ---
# Aap yahan apna production URL daal sakte hain.
# Agar aap local par test kar rahe hain, toh yeh NEXT_PUBLIC_APP_URL environment variable se lega.
BASE_URL = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

VEHICLES_ENDPOINT = "/api/marketplace/vehicles"
BANNERS_ENDPOINT = "/api/marketplace/banners"

# --- Helper Functions for Pretty Printing ---

def print_header(title: str):
    """Prints a formatted header."""
    print("\n" + "="*80)
    print(f"  {title.upper()}")
    print("="*80)

def print_error(message: str, details: str):
    """Prints a formatted error message."""
    print("\n" + "!"*80)
    print(f"  ERROR: {message}")
    if details:
        print(f"  DETAILS: {details}")
    print("!"*80)

def print_table(headers: List[str], data: List[Dict[str, Any]], url_base: str):
    """Prints data in a formatted table."""
    if not data:
        print("\n  --> No data returned from the API.")
        return

    # Column widths ko calculate karein
    col_widths = {header: len(header) for header in headers}
    for row in data:
        for header in headers:
            # Full URL banane ke liye logic
            value = row.get(header)
            if header == 'imageUrl' and value and not value.startswith('http'):
                 value = f"{url_base}{value}"

            cell_len = len(str(value)) if value is not None else 4
            if cell_len > col_widths[header]:
                col_widths[header] = cell_len

    # Header print karein
    header_line = " | ".join(header.upper().ljust(col_widths[header]) for header in headers)
    print("\n" + header_line)
    print("-" * len(header_line))

    # Data rows print karein
    for row in data:
        row_values = []
        for header in headers:
            value = row.get(header, "N/A")
            # Image URL ke liye full path banayein
            if header == 'imageUrl' and value and not str(value).startswith('http'):
                value = f"{url_base}{value}"
            
            row_values.append(str(value).ljust(col_widths[header]))
        print(" | ".join(row_values))
    print("-" * len(header_line))


# --- Main Test Function ---

def test_marketplace_api():
    """Main function to run the API tests."""
    
    # === VEHICLES API TEST ===
    print_header("Testing Marketplace Vehicles API")
    vehicles_url = f"{BASE_URL}{VEHICLES_ENDPOINT}"
    print(f"Requesting data from: {vehicles_url}\n")
    
    try:
        response_vehicles = requests.get(vehicles_url)
        
        # Check for HTTP errors
        response_vehicles.raise_for_status() 
        
        vehicles_data = response_vehicles.json()
        
        if isinstance(vehicles_data, list):
            print(f"Success! Received {len(vehicles_data)} vehicle listings.")
            vehicle_headers = ['id', 'make', 'model', 'price', 'odometer', 'imageUrl']
            print_table(vehicle_headers, vehicles_data, BASE_URL)
        else:
            print_error("Unexpected data format.", f"Expected a list of vehicles, but got: {type(vehicles_data)}")

    except requests.exceptions.HTTPError as e:
        print_error("Failed to fetch data from Vehicles API.", f"Status Code: {e.response.status_code}, Response: {e.response.text}")
    except requests.exceptions.ConnectionError as e:
        print_error("Could not connect to the server.", f"Please ensure the server is running at {BASE_URL}")
    except Exception as e:
        print_error("An unexpected error occurred during vehicle test.", str(e))


    # === BANNERS API TEST ===
    print_header("Testing Marketplace Banners API")
    banners_url = f"{BASEURL}{BANNERS_ENDPOINT}"
    print(f"Requesting data from: {banners_url}\n")

    try:
        response_banners = requests.get(banners_url)
        
        # Check for HTTP errors
        response_banners.raise_for_status()

        banners_data = response_banners.json()

        if isinstance(banners_data, list):
            print(f"Success! Received {len(banners_data)} banners.")
            banner_headers = ['title', 'imageUrl']
            print_table(banner_headers, banners_data, BASE_URL)
        else:
            print_error("Unexpected data format.", f"Expected a list of banners, but got: {type(banners_data)}")

    except requests.exceptions.HTTPError as e:
        print_error("Failed to fetch data from Banners API.", f"Status Code: {e.response.status_code}, Response: {e.response.text}")
    except requests.exceptions.ConnectionError as e:
        print_error("Could not connect to the server.", f"Please ensure the server is running at {BASE_URL}")
    except Exception as e:
        print_error("An unexpected error occurred during banner test.", str(e))


if __name__ == "__main__":
    test_marketplace_api()
