package com.example.backend.service;

//Interface for QR code operations.
public interface SpecialCollectionQRService {
    
    /**
     * Generates QR code as Base64 string.
     * 
     * @param collectionId The collection ID
     * @param userId The user ID
     * @return Base64 encoded QR code
     */
    String generateQRCodeBase64(String collectionId, String userId);
    
    /**
     * Generates QR code as byte array.
     * 
     * @param collectionId The collection ID
     * @param userId The user ID
     * @return QR code byte array
     */
    byte[] generateQRCodeBytes(String collectionId, String userId);
}
