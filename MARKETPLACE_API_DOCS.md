
# Marketplace Vehicle API Documentation

This document provides instructions on how to add a new vehicle to the marketplace using the provided API endpoint.

## API Endpoint

**URL:** `/api/marketplace/vehicles`

**Method:** `POST`

**Headers:**
- `Content-Type`: `application/json`

---

## JSON Payload Parameters

Below is a complete list of all available parameters that can be included in the JSON body of your POST request.

### Core Details
| Parameter  | Type   | Required | Description                               | Example               |
|------------|--------|----------|-------------------------------------------|-----------------------|
| `make`     | string | **Yes**  | The manufacturer of the vehicle.          | `"Maruti Suzuki"`     |
| `model`    | string | **Yes**  | The model of the vehicle.                 | `"Swift"`             |
| `price`    | number | **Yes**  | The selling price in INR.                 | `550000`              |
| `variant`  | string | No       | The specific variant of the model.        | `"VXI"`               |
| `year`     | number | No       | Legacy manufacturing year field.          | `2021`                |
| `status`   | string | No       | `"For Sale"` or `"Sold"`. Defaults to `"For Sale"`. | `"For Sale"`          |
| `verified` | boolean| No       | Set to `true` if verified by admin. Defaults to `false`. | `true`                |


### Registration & Manufacturing
| Parameter    | Type   | Required | Description                               | Example               |
|--------------|--------|----------|-------------------------------------------|-----------------------|
| `mfgYear`    | number | No       | The manufacturing year.                   | `2020`                |
| `regYear`    | number | No       | The registration year.                    | `2021`                |
| `regNumber`  | string | No       | The vehicle's registration number (plate).| `"MH12AB1234"`        |
| `rtoState`   | string | No       | The state where the RTO is registered.    | `"Maharashtra"`       |
| `ownership`  | string | No       | Ownership details like "1st Owner".       | `"1st Owner"`         |


### Specifications
| Parameter      | Type   | Required | Description                               | Example               |
|----------------|--------|----------|-------------------------------------------|-----------------------|
| `odometer`     | number | No       | Total kilometers driven.                  | `45000`               |
| `fuelType`     | string | No       | "Petrol", "Diesel", "CNG", "Electric", "LPG", "Hybrid" | `"Petrol"`            |
| `transmission` | string | No       | "Manual" or "Automatic".                  | `"Automatic"`         |
| `insurance`    | string | No       | "Comprehensive", "Third Party", "None".   | `"Comprehensive"`     |
| `serviceHistory`| string| No       | "Available" or "Not Available".           | `"Available"`         |
| `color`        | string | No       | The exterior color of the vehicle.        | `"White"`             |


### Image URLs
All image parameters are of type `string` and are **optional**. You should provide public URLs for any images you want to include.

- `imageUrl` (Main image for the listing card)
- `img_front`
- `img_front_right`
- `img_right`
- `img_back_right`
- `img_back`
- `img_open_dickey`
- `img_back_left`
- `img_left`
- `img_front_left`
- `img_open_bonnet`
- `img_dashboard`
- `img_right_front_door`
- `img_right_back_door`
- `img_tyre_1`
- `img_tyre_2`
- `img_tyre_3`
- `img_tyre_4`
- `img_tyre_optional`
- `img_engine`
- `img_roof`

---

## Sample `curl` Request

```bash
curl -X POST https://9000-firebase-studio-1757611792048.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev/api/marketplace/vehicles \
-H "Content-Type: application/json" \
-d '{
  "make": "Hyundai",
  "model": "i20",
  "price": 750000,
  "variant": "Asta (O)",
  "mfgYear": 2022,
  "regYear": 2022,
  "regNumber": "DL5CA5678",
  "odometer": 15000,
  "fuelType": "Petrol",
  "transmission": "Manual",
  "rtoState": "Delhi",
  "ownership": "1st Owner",
  "color": "Red",
  "verified": true,
  "status": "For Sale",
  "imageUrl": "https://placehold.co/600x400/ff0000/white?text=Hyundai+i20",
  "img_front": "https://placehold.co/600x400/ff0000/white?text=Front",
  "img_dashboard": "https://placehold.co/600x400/cccccc/black?text=Dashboard"
}'
```

### Successful Response (Status 201)
```json
{
  "message": "Vehicle listed successfully via API",
  "vehicle": {
    "id": "generated-uuid-here",
    "make": "Hyundai",
    "model": "i20",
    "price": 750000,
    // ... all other submitted fields ...
    "createdAt": "iso-timestamp-here",
    "updatedAt": "iso-timestamp-here"
  }
}
```
