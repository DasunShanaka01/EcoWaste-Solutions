package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "waste_accounts")
public class WasteAccount {
    @Id
    private String id;
    
    @Field("account_id")
    private String accountId; // Auto-generated unique account ID
    
    @Field("user_id")
    private String userId; // Reference to User
    
    @Field("location")
    private Location location;
    
    @Field("qr_code")
    private String qrCode; // Base64 encoded QR code
    
    @Field("created_at")
    private Instant createdAt;
    
    @Field("is_active")
    private boolean isActive = true;

    // Default constructor
    public WasteAccount() {
    }

    // Constructor with required fields
    public WasteAccount(String accountId, String userId, Location location) {
        this.accountId = accountId;
        this.userId = userId;
        this.location = location;
        this.createdAt = Instant.now();
        this.isActive = true;
    }

    // Inner class for location
    public static class Location {
        private double latitude;
        private double longitude;
        private String address;
        private String city;
        private String country;

        public Location() {
        }

        public Location(double latitude, double longitude, String address, String city, String country) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.city = city;
            this.country = country;
        }

        // Getters and setters for Location
        public double getLatitude() {
            return latitude;
        }

        public void setLatitude(double latitude) {
            this.latitude = latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public void setLongitude(double longitude) {
            this.longitude = longitude;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
