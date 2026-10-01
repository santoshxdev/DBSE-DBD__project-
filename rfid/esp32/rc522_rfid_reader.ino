/*
  ==================================================================================
  ESP32 + RC522 RFID READER INTEGRATION FOR LIBRARY MANAGEMENT SYSTEM
  ==================================================================================
  Course: Database Systems Engineering and Distributed Backend Development
  Target Microcontroller: ESP32 Dev Module
  RFID Module: MFRC522 (SPI interface)

  Hardware Wiring Diagram:
  -----------------------------------------
  MFRC522 Pin  <-->  ESP32 GPIO Pin
  -----------------------------------------
  SDA (SS)     <-->  GPIO 5
  SCK          <-->  GPIO 18
  MOSI         <-->  GPIO 23
  MISO         <-->  GPIO 19
  GND          <-->  GND
  RST          <-->  GPIO 22
  3.3V         <-->  3.3V  (DO NOT CONNECT TO 5V!)
  -----------------------------------------

  Required Arduino Libraries:
  - MFRC522 by github.com/miguelbalboa/rfid
  - WiFi (Built-in ESP32)
  - HTTPClient (Built-in ESP32)
  - ArduinoJson (by Benoit Blanchon)
  ==================================================================================
*/

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------------
// CONFIGURATION PARAMETERS (Update to match your local WiFi and Backend IP)
// ----------------------------------------------------------------------------------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server API Endpoint (Replace with your local computer's IP address on Wi-Fi)
const char* BACKEND_SCAN_URL = "http://192.168.1.100:5000/api/rfid/scan";
const char* DEVICE_ID = "ESP32_RFID_READER_01";

// Pin definitions
#define SS_PIN  5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   ESP32 RFID Library Reader Starting...         ");
  Serial.println("=================================================");

  // Initialize SPI bus and RC522 reader
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[Hardware] MFRC522 RFID Reader Initialized.");

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting to network: ");
  Serial.println(WIFI_SSID);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(500);
    Serial.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Connected successfully! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WiFi Warning] Could not connect to Wi-Fi. Operating in Serial-only mode.");
  }
}

void loop() {
  // Check if new card present
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  // Read card serial
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Convert UID byte array to Hexadecimal string
  String rfidUid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      rfidUid += "0";
    }
    rfidUid += String(rfid.uid.uidByte[i], HEX);
  }
  rfidUid.toUpperCase();

  Serial.println("\n-------------------------------------------------");
  Serial.print("[RFID Card Detected] UID: ");
  Serial.println(rfidUid);

  // Send UID payload to backend REST API
  sendScanToBackend(rfidUid);

  // Halt PICC & Stop Encryption on PCD
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(2000); // 2-second cooldown between consecutive scans
}

/**
 * Sends HTTP POST request to Backend API with RFID payload
 */
void sendScanToBackend(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP Error] WiFi is disconnected. Payload omitted.");
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_SCAN_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON document
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["uid"] = uid;
  jsonDoc["deviceId"] = DEVICE_ID;

  String jsonPayload;
  serializeJson(jsonDoc, jsonPayload);

  Serial.print("[HTTP POST] Sending payload to ");
  Serial.println(BACKEND_SCAN_URL);
  Serial.println("[HTTP Payload] " + jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP Response Code] ");
    Serial.println(httpResponseCode);
    Serial.println("[HTTP Response] " + response);
  } else {
    Serial.print("[HTTP Error] Request failed, error code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}
