package com.example.backend.service;

import com.example.backend.model.SpecialCollection;

import java.util.List;
import java.util.Optional;

//Interface for query operations.
public interface SpecialCollectionQueryService {
    
    /**
     * Gets all collections for a user.
     * 
     * @param userId The user ID
     * @return List of user's collections
     */
    List<SpecialCollection> listUserCollections(String userId);
    
    /**
     * Gets all collections.
     * 
     * @return List of all collections
     */
    List<SpecialCollection> findAll();
    
    /**
     * Counts total collections.
     * 
     * @return Total count
     */
    long count();
    
    /**
     * Finds a collection by simple ID.
     * 
     * @param id The simple ID
     * @return Optional collection
     */
    Optional<SpecialCollection> findBySimpleId(String id);
}
