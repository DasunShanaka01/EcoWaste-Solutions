package com.example.backend.service;

import com.example.backend.model.SpecialCollection;

import java.util.List;
import java.util.Optional;

//Interface for status management operations.
 
public interface SpecialCollectionStatusService {
    
    /**
     * Marks a collection as paid.
     * 
     * @param userId The user ID
     * @param collectionId The collection ID
     * @return The updated collection
     */
    SpecialCollection markPaid(String userId, String collectionId);
    
    /**
     * Marks a collection as cash pending.
     * 
     * @param userId The user ID
     * @param collectionId The collection ID
     * @return The updated collection
     */
    SpecialCollection markCashPending(String userId, String collectionId);
    
    /**
     * Marks a collection as unpaid.
     * 
     * @param userId The user ID
     * @param collectionId The collection ID
     * @param method The payment method
     * @return The updated collection
     */
    SpecialCollection markUnpaid(String userId, String collectionId, String method);
    
    /**
     * Cancels a collection.
     * 
     * @param userId The user ID
     * @param collectionId The collection ID
     * @return The cancelled collection
     */
    SpecialCollection cancelCollection(String userId, String collectionId);
    
    /**
     * Marks a collection as collected.
     * 
     * @param qrCodeData The QR code data
     * @return The updated collection
     */
    SpecialCollection markCollected(String qrCodeData);
    
    /**
     * Updates a collection.
     * 
     * @param collection The collection to update
     * @return The updated collection
     */
    SpecialCollection update(SpecialCollection collection);
}
