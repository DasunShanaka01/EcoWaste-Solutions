package com.example.backend.dto;

/**
 * DTO for collection request data
 * Single Responsibility: Data transfer for collection requests
 */
public class CollectionRequestDTO {
    private String accountId;
    private String accountHolder;
    private String address;
    private double weight;
    private String wasteType;
    private LocationDTO location;
    private String collectorId;
    
    // Constructors
    public CollectionRequestDTO() {}
    
    public CollectionRequestDTO(String accountId, String accountHolder, String address, 
                               double weight, String wasteType, LocationDTO location, String collectorId) {
        this.accountId = accountId;
        this.accountHolder = accountHolder;
        this.address = address;
        this.weight = weight;
        this.wasteType = wasteType;
        this.location = location;
        this.collectorId = collectorId;
    }
    
    // Getters and setters
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    
    public String getAccountHolder() { return accountHolder; }
    public void setAccountHolder(String accountHolder) { this.accountHolder = accountHolder; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
    
    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }
    
    public LocationDTO getLocation() { return location; }
    public void setLocation(LocationDTO location) { this.location = location; }
    
    public String getCollectorId() { return collectorId; }
    public void setCollectorId(String collectorId) { this.collectorId = collectorId; }
    
    /**
     * Inner class for location data
     */
    public static class LocationDTO {
        private double latitude;
        private double longitude;
        private String address;
        
        // Constructors
        public LocationDTO() {}
        
        public LocationDTO(double latitude, double longitude, String address) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
        }
        
        // Getters and setters
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }
}
