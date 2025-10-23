package com.example.backend.controller;

import com.example.backend.model.Collection;
import com.example.backend.service.CollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/collections")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CollectionController {
    
    @Autowired
    private CollectionService collectionService;
    
    /**
     * Create a new collection record
     */
    @PostMapping
    public ResponseEntity<?> createCollection(@RequestBody CollectionRequest request) {
        try {
            // Create location object
            Collection.Location location = null;
            if (request.getLocation() != null) {
                location = new Collection.Location(
                    request.getLocation().getLatitude(),
                    request.getLocation().getLongitude(),
                    request.getLocation().getAddress()
                );
            }
            
            // Create collection
            Collection collection = collectionService.createCollection(
                request.getAccountId(),
                request.getAccountHolder(),
                request.getAddress(),
                request.getWeight(),
                request.getWasteType(),
                location,
                request.getCollectorId()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Collection saved successfully");
            response.put("collection", collection);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to save collection: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all collections
     */
    @GetMapping
    public ResponseEntity<List<Collection>> getAllCollections() {
        List<Collection> collections = collectionService.getAllCollections();
        return ResponseEntity.ok(collections);
    }
    
    /**
     * Get collection by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCollectionById(@PathVariable String id) {
        Optional<Collection> collection = collectionService.getCollectionById(id);
        if (collection.isPresent()) {
            return ResponseEntity.ok(collection.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get collections by collector ID
     */
    @GetMapping("/collector/{collectorId}")
    public ResponseEntity<List<Collection>> getCollectionsByCollectorId(@PathVariable String collectorId) {
        List<Collection> collections = collectionService.getCollectionsByCollectorId(collectorId);
        return ResponseEntity.ok(collections);
    }
    
    /**
     * Get collections by account ID
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Collection>> getCollectionsByAccountId(@PathVariable String accountId) {
        List<Collection> collections = collectionService.getCollectionsByAccountId(accountId);
        return ResponseEntity.ok(collections);
    }
    
    /**
     * Get collection statistics for a collector
     */
    @GetMapping("/stats/{collectorId}")
    public ResponseEntity<CollectionService.CollectionStats> getCollectionStats(@PathVariable String collectorId) {
        CollectionService.CollectionStats stats = collectionService.getCollectionStats(collectorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Update collection status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateCollectionStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            Collection collection = collectionService.updateCollectionStatus(id, status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Collection status updated successfully");
            response.put("collection", collection);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to update collection status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Delete collection by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCollection(@PathVariable String id) {
        try {
            collectionService.deleteCollection(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Collection deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to delete collection: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Request DTO for creating collections
     */
    public static class CollectionRequest {
        private String accountId;
        private String accountHolder;
        private String address;
        private double weight;
        private String wasteType;
        private LocationRequest location;
        private String collectorId;
        
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
        
        public LocationRequest getLocation() { return location; }
        public void setLocation(LocationRequest location) { this.location = location; }
        
        public String getCollectorId() { return collectorId; }
        public void setCollectorId(String collectorId) { this.collectorId = collectorId; }
    }
    
    /**
     * Location request DTO
     */
    public static class LocationRequest {
        private double latitude;
        private double longitude;
        private String address;
        
        // Getters and setters
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }
}
