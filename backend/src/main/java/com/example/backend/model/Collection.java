package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "collections")
public class Collection {
    @Id
    private String id;
    
    @Field("account_id")
    private String accountId; // Reference to WasteAccount
    
    @Field("account_holder")
    private String accountHolder; // Name of the account holder
    
    @Field("address")
    private String address; // Collection address
    
    @Field("weight")
    private double weight; // Weight in kg
    
    @Field("waste_type")
    private String wasteType; // Type of waste collected
    
    @Field("location")
    private Location location; // GPS coordinates
    
    @Field("collector_id")
    private String collectorId; // ID of the collector
    
    @Field("status")
    private String status = "collected"; // Collection status
    
    @Field("created_at")
    private Instant createdAt = Instant.now();
    
    @Field("collection_timestamp")
    private Instant collectionTimestamp = Instant.now();

    // Default constructor
    public Collection() {
    }

    // Constructor with required fields
    public Collection(String accountId, String accountHolder, String address, double weight, String wasteType, Location location, String collectorId) {
        this.accountId = accountId;
        this.accountHolder = accountHolder;
        this.address = address;
        this.weight = weight;
        this.wasteType = wasteType;
        this.location = location;
        this.collectorId = collectorId;
        this.createdAt = Instant.now();
        this.collectionTimestamp = Instant.now();
    }

    // Inner class for location
    public static class Location {
        private double latitude;
        private double longitude;
        private String address;

        // Default constructor
        public Location() {
        }

        // Constructor with coordinates
        public Location(double latitude, double longitude, String address) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
        }

        // Getters and setters
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

    public String getAccountHolder() {
        return accountHolder;
    }

    public void setAccountHolder(String accountHolder) {
        this.accountHolder = accountHolder;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String getWasteType() {
        return wasteType;
    }

    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getCollectorId() {
        return collectorId;
    }

    public void setCollectorId(String collectorId) {
        this.collectorId = collectorId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCollectionTimestamp() {
        return collectionTimestamp;
    }

    public void setCollectionTimestamp(Instant collectionTimestamp) {
        this.collectionTimestamp = collectionTimestamp;
    }
}
