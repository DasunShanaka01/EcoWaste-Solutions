package com.example.backend.repository;

import com.example.backend.model.Collection;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionRepository extends MongoRepository<Collection, String> {
    
    // Find collections by collector ID
    List<Collection> findByCollectorId(String collectorId);
    
    // Find collections by account ID
    List<Collection> findByAccountId(String accountId);
    
    // Find collections by status
    List<Collection> findByStatus(String status);
    
    // Find collections by collector ID and status
    List<Collection> findByCollectorIdAndStatus(String collectorId, String status);
    
    // Find collections by date range (using createdAt)
    List<Collection> findByCreatedAtBetween(java.time.Instant startDate, java.time.Instant endDate);
}
