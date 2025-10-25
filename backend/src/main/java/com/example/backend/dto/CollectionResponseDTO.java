package com.example.backend.dto;

import com.example.backend.model.Collection;
import java.time.Instant;

/**
 * DTO for collection response data
 * Single Responsibility: Data transfer for collection responses
 */
public class CollectionResponseDTO {
    private boolean success;
    private String message;
    private Collection data;
    private String error;
    
    // Constructors
    public CollectionResponseDTO() {}
    
    public CollectionResponseDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public CollectionResponseDTO(boolean success, String message, Collection data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
    
    public CollectionResponseDTO(boolean success, String message, Collection data, String error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }
    
    // Static factory methods
    public static CollectionResponseDTO success(String message) {
        return new CollectionResponseDTO(true, message);
    }
    
    public static CollectionResponseDTO success(String message, Collection data) {
        return new CollectionResponseDTO(true, message, data);
    }
    
    public static CollectionResponseDTO error(String error) {
        return new CollectionResponseDTO(false, null, null, error);
    }
    
    // Getters and setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Collection getData() { return data; }
    public void setData(Collection data) { this.data = data; }
    
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
