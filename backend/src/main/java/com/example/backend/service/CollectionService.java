package com.example.backend.service;

import com.example.backend.model.Collection;
import com.example.backend.repository.CollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class CollectionService {
    
    @Autowired
    private CollectionRepository collectionRepository;
    
    /**
     * Save a new collection record
     */
    public Collection saveCollection(Collection collection) {
        return collectionRepository.save(collection);
    }
    
    /**
     * Create a new collection from the provided data
     */
    public Collection createCollection(String accountId, String accountHolder, String address, 
                                     double weight, String wasteType, Collection.Location location, 
                                     String collectorId) {
        Collection collection = new Collection(accountId, accountHolder, address, weight, wasteType, location, collectorId);
        return collectionRepository.save(collection);
    }
    
    /**
     * Get all collections
     */
    public List<Collection> getAllCollections() {
        return collectionRepository.findAll();
    }
    
    /**
     * Get collection by ID
     */
    public Optional<Collection> getCollectionById(String id) {
        return collectionRepository.findById(id);
    }
    
    /**
     * Get collections by collector ID
     */
    public List<Collection> getCollectionsByCollectorId(String collectorId) {
        return collectionRepository.findByCollectorId(collectorId);
    }
    
    /**
     * Get collections by account ID
     */
    public List<Collection> getCollectionsByAccountId(String accountId) {
        return collectionRepository.findByAccountId(accountId);
    }
    
    /**
     * Get collections by status
     */
    public List<Collection> getCollectionsByStatus(String status) {
        return collectionRepository.findByStatus(status);
    }
    
    /**
     * Get collections by collector ID and status
     */
    public List<Collection> getCollectionsByCollectorIdAndStatus(String collectorId, String status) {
        return collectionRepository.findByCollectorIdAndStatus(collectorId, status);
    }
    
    /**
     * Get collections by date range
     */
    public List<Collection> getCollectionsByDateRange(Instant startDate, Instant endDate) {
        return collectionRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    /**
     * Update collection status
     */
    public Collection updateCollectionStatus(String id, String status) {
        Optional<Collection> collectionOpt = collectionRepository.findById(id);
        if (collectionOpt.isPresent()) {
            Collection collection = collectionOpt.get();
            collection.setStatus(status);
            return collectionRepository.save(collection);
        }
        throw new RuntimeException("Collection not found with ID: " + id);
    }
    
    /**
     * Delete collection by ID
     */
    public void deleteCollection(String id) {
        collectionRepository.deleteById(id);
    }
    
    /**
     * Get collection statistics for a collector
     */
    public CollectionStats getCollectionStats(String collectorId) {
        List<Collection> collections = collectionRepository.findByCollectorId(collectorId);
        
        int totalCollections = collections.size();
        double totalWeight = collections.stream().mapToDouble(Collection::getWeight).sum();
        long todayCollections = collections.stream()
            .filter(c -> c.getCreatedAt().isAfter(Instant.now().minusSeconds(24 * 60 * 60)))
            .count();
        
        return new CollectionStats(totalCollections, totalWeight, todayCollections);
    }
    
    /**
     * Inner class for collection statistics
     */
    public static class CollectionStats {
        private int totalCollections;
        private double totalWeight;
        private long todayCollections;
        
        public CollectionStats(int totalCollections, double totalWeight, long todayCollections) {
            this.totalCollections = totalCollections;
            this.totalWeight = totalWeight;
            this.todayCollections = todayCollections;
        }
        
        // Getters
        public int getTotalCollections() { return totalCollections; }
        public double getTotalWeight() { return totalWeight; }
        public long getTodayCollections() { return todayCollections; }
    }
}
