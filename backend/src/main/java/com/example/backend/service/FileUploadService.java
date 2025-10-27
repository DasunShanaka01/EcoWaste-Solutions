package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service for handling file upload operations
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling file operations
 * - Open/Closed Principle (OCP): File operations can be extended by adding new
 * methods without modifying existing code
 * - Interface Segregation Principle (ISP): Provides focused file operation
 * methods rather than one large method
 * - Dependency Inversion Principle (DIP): No dependencies on concrete
 * implementations, pure file handling logic
 */
@Service
public class FileUploadService {

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Centralized configuration for file upload settings
    private static final String UPLOAD_DIR = "uploads/";

    /**
     * Save uploaded file to filesystem
     * 
     * @param file MultipartFile to save
     * @return URL path to saved file, or null if save failed
     */
    public String saveFile(MultipartFile file) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - saving files to filesystem
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
            // Each operation has a single responsibility
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(UPLOAD_DIR);
            Files.createDirectories(uploadPath);

            // Generate unique filename to avoid conflicts
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "_" +
                    System.currentTimeMillis() + extension;

            Path filePath = uploadPath.resolve(uniqueFilename);

            // Save the file
            Files.write(filePath, file.getBytes());

            return "/uploads/" + uniqueFilename;

        } catch (IOException e) {
            System.err.println("Error saving file: " + e.getMessage());
            return null;
        }
    }

    /**
     * Delete file from filesystem
     * 
     * @param filePath Path to file to delete
     * @return True if deleted successfully, false otherwise
     */
    public boolean deleteFile(String filePath) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - deleting files from filesystem
        if (filePath == null || filePath.trim().isEmpty()) {
            return false;
        }

        try {
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            Path path = Paths.get(cleanPath);

            if (Files.exists(path)) {
                Files.delete(path);
                return true;
            }

            return false;

        } catch (IOException e) {
            System.err.println("Error deleting file: " + e.getMessage());
            return false;
        }
    }

    /**
     * Check if file exists
     * 
     * @param filePath Path to file to check
     * @return True if file exists, false otherwise
     */
    public boolean fileExists(String filePath) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - checking file existence
        if (filePath == null || filePath.trim().isEmpty()) {
            return false;
        }

        try {
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            Path path = Paths.get(cleanPath);

            return Files.exists(path);

        } catch (Exception e) {
            System.err.println("Error checking file existence: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get file size in bytes
     * 
     * @param filePath Path to file
     * @return File size in bytes, or -1 if error
     */
    public long getFileSize(String filePath) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - getting file size
        if (filePath == null || filePath.trim().isEmpty()) {
            return -1;
        }

        try {
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            Path path = Paths.get(cleanPath);

            if (Files.exists(path)) {
                return Files.size(path);
            }

            return -1;

        } catch (IOException e) {
            System.err.println("Error getting file size: " + e.getMessage());
            return -1;
        }
    }

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // This helper method has a single responsibility - extracting file extension
    private String getFileExtension(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }

        return "";
    }
}
