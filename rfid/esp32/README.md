# ESP32 + RC522 RFID Hardware Setup Guide

This folder contains the Arduino C++ sketch (`rc522_rfid_reader.ino`) for integrating physical ESP32 microcontrollers with RC522 RFID card readers into the **Library Management System with RFID**.

---

## 1. Hardware Pin Connections

| MFRC522 RFID Pin | ESP32 GPIO Pin | Description |
| :--- | :--- | :--- |
| **SDA (SS)** | **GPIO 5** | SPI Slave Select |
| **SCK** | **GPIO 18** | SPI Clock |
| **MOSI** | **GPIO 23** | SPI Master Out Slave In |
| **MISO** | **GPIO 19** | SPI Master In Slave Out |
| **RST** | **GPIO 22** | Reset Pin |
| **GND** | **GND** | Ground |
| **3.3V** | **3.3V** | **3.3V Power** *(Do NOT connect to 5V!)* |

---

## 2. Software Requirements & Arduino IDE Setup

1. Install [Arduino IDE](https://www.arduino.cc/en/software).
2. Add ESP32 Board support:
   - Go to `File > Preferences`.
   - Add URL to *Additional Boards Manager URLs*:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Open `Tools > Board > Boards Manager`, search **ESP32** and click **Install**.
3. Install required libraries via `Tools > Manage Libraries`:
   - `MFRC522` by Miguel Balboa
   - `ArduinoJson` by Benoit Blanchon

---

## 3. Configuration & Flashing

1. Open `rc522_rfid_reader.ino` in Arduino IDE.
2. Update Wi-Fi and Server IP settings:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* BACKEND_SCAN_URL = "http://192.168.1.X:5000/api/rfid/scan";
   ```
3. Connect ESP32 to USB port, select correct COM port under `Tools > Port`.
4. Click **Upload**.
5. Open **Serial Monitor** at baud rate **115200** to observe live card scans and HTTP POST response payloads.

---

## 4. Hardware API Endpoint Specs

- **Endpoint**: `POST /api/rfid/scan`
- **Request Body**:
  ```json
  {
    "uid": "A1B2C3D4",
    "deviceId": "ESP32_RFID_READER_01"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "scanResult": {
      "uid": "A1B2C3D4",
      "type": "MEMBER",
      "eventType": "MEMBER_SCAN",
      "entity": { ... }
    }
  }
  ```
