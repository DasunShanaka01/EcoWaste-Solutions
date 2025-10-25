package com.example.backend.controller;

import com.example.backend.dto.CollectionRequestDTO;
import com.example.backend.dto.CollectionResponseDTO;
import com.example.backend.model.Collection;
import com.example.backend.service.CollectionService;
import com.example.backend.service.CollectionMapper;
import com.example.backend.validator.CollectionValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller responsible for handling collection-related HTTP requests
 * Single Responsibility: HTTP request handling for collections
 */
@RestController
@RequestMapping("/api/collections")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CollectionController {
    
    @Autowired
    private CollectionService collectionService;
    
    @Autowired
    private CollectionMapper collectionMapper;
    
    @Autowired
    private CollectionValidator collectionValidator;
    
    /**
     * Create a new collection record
     */
    @PostMapping
    public ResponseEntity<CollectionResponseDTO> createCollection(@RequestBody CollectionRequestDTO request) {
        try {
            // Validate request
            CollectionValidator.ValidationResult validation = collectionValidator.validate(request);
            if (!validation.isValid()) {
                return ResponseEntity.badRequest().body(CollectionResponseDTO.error(validation.getErrorMessage()));
            }
            
            // Map DTO to entity
            Collection collection = collectionMapper.toEntity(request);
            
            // Create collection
            Collection createdCollection = collectionService.createCollection(
                collection.getAccountId(),
                collection.getAccountHolder(),
                collection.getAddress(),
                collection.getWeight(),
                collection.getWasteType(),
                collection.getLocation(),
                collection.getCollectorId()
            );
            
            return ResponseEntity.ok(CollectionResponseDTO.success("Collection saved successfully", createdCollection));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CollectionResponseDTO.error("Failed to save collection: " + e.getMessage()));
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
    public ResponseEntity<CollectionResponseDTO> updateCollectionStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(CollectionResponseDTO.error("Status is required"));
            }
            
            Collection collection = collectionService.updateCollectionStatus(id, status);
            return ResponseEntity.ok(CollectionResponseDTO.success("Collection status updated successfully", collection));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CollectionResponseDTO.error("Failed to update collection status: " + e.getMessage()));
        }
    }
    
    /**
     * Delete collection by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<CollectionResponseDTO> deleteCollection(@PathVariable String id) {
        try {
            collectionService.deleteCollection(id);
            return ResponseEntity.ok(CollectionResponseDTO.success("Collection deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CollectionResponseDTO.error("Failed to delete collection: " + e.getMessage()));
        }
    }
    
}
