package com.example.backend.service;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.exception.CustomException;
import com.example.backend.model.SpecialCollection;
import com.example.backend.model.User;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.strategy.FeeCalculationStrategy;
import com.example.backend.strategy.SchedulingStrategy;
import com.example.backend.util.SpecialCollectionEmailHelper;
import com.example.backend.util.SpecialCollectionMapper;
import com.example.backend.util.SpecialCollectionValidator;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialCollectionServiceImpl implements SpecialCollectionService { // Main service implementation for special collection operations

    private final SpecialCollectionRepository specialCollectionRepository; // Repository for database operations
    private final UserRepository userRepository; // Repository for user operations
    private final EmailService emailService; // Service for sending emails
    private final QRCodeService qrCodeService; // Service for QR code generation
    private final FeeCalculationStrategy feeCalculationStrategy; // Strategy for fee calculation
    private final SchedulingStrategy schedulingStrategy; // Strategy for scheduling logic
    private final SpecialCollectionValidator validator; // Helper for validation logic
    private final SpecialCollectionMapper mapper; // Helper for data mapping
    private final SpecialCollectionEmailHelper emailHelper; // Helper for email operations

    private static final int MAX_PER_SLOT = 10; // Maximum collections per time slot
    private static final List<String> ALL_SLOTS = Arrays.asList("Morning", "Afternoon"); // Available time slots
    public SpecialCollectionServiceImpl(SpecialCollectionRepository specialCollectionRepository, // Constructor with dependency injection
                                        UserRepository userRepository,
                                        EmailService emailService,
                                        QRCodeService qrCodeService,
                                        FeeCalculationStrategy feeCalculationStrategy,
                                        SchedulingStrategy schedulingStrategy,
                                        SpecialCollectionValidator validator,
                                        SpecialCollectionMapper mapper,
                                        SpecialCollectionEmailHelper emailHelper) {
        this.specialCollectionRepository = specialCollectionRepository; // Initialize repository
        this.userRepository = userRepository; // Initialize user repository
        this.emailService = emailService; // Initialize email service
        this.qrCodeService = qrCodeService; // Initialize QR code service
        this.feeCalculationStrategy = feeCalculationStrategy; // Initialize fee calculation strategy
        this.schedulingStrategy = schedulingStrategy; // Initialize scheduling strategy
        this.validator = validator; // Initialize validator helper
        this.mapper = mapper; // Initialize mapper helper
        this.emailHelper = emailHelper; // Initialize email helper
    }

    @Override
    public double calculateFee(FeeRequest req) { // Calculate collection fee using strategy pattern
        return feeCalculationStrategy.calculateFee(req); // Delegate to fee calculation strategy
    }

    @Override
    public List<String> getAvailableDates(int days) { // Get available collection dates
        return schedulingStrategy.getAvailableDates(days); // Delegate to scheduling strategy
    }

    @Override
    public List<String> getAvailableSlots(String date) { // Get available time slots for specific date
        return schedulingStrategy.getAvailableSlots(date); // Delegate to scheduling strategy
    }

    @Override
    public SpecialCollection schedule(String userId, ScheduleRequest req) { // Schedule new collection
        try {
            validator.validateUserEligibility(userId); // Validate user can schedule collections
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        try {
            validator.validateScheduleRequest(req); // Validate schedule request data
        } catch (IllegalArgumentException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        List<String> slots = getAvailableSlots(req.date); // Get available slots for date
        try {
            validator.validateSlotAvailability(req.date, req.timeSlot, slots); // Validate slot availability
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        double calculatedFee = calculateFee(mapper.toFeeRequest(req)); // Calculate collection fee
        SpecialCollection collection = mapper.mapToEntity(userId, req, calculatedFee); // Map request to entity
        
        SpecialCollection saved = specialCollectionRepository.save(collection); // Save collection to database
        String qrData = qrCodeService.generateCollectionQRData(saved.getId(), userId); // Generate QR code data
        saved.setQrCodeData(qrData); // Set QR code data
        saved = specialCollectionRepository.save(saved); // Save updated collection with QR data
        
        emailHelper.sendConfirmationEmail(userId, saved); // Send confirmation email
        
        return saved; // Return saved collection
    }

    @Override
    public SpecialCollection reschedule(String userId, String collectionId, String date, String timeSlot) { // Reschedule existing collection
        SpecialCollection sc = specialCollectionRepository.findById(collectionId) // Find collection by ID
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        try {
            validator.validateUserAuthorization(sc, userId); // Validate user owns collection
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        try {
            validator.validateReschedulingRules(date, timeSlot); // Validate rescheduling rules
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        List<String> slots = getAvailableSlots(date); // Get available slots for new date
        try {
            validator.validateSlotAvailability(date, timeSlot, slots); // Validate slot availability
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        mapper.updateCollectionSchedule(sc, date, timeSlot); // Update collection schedule
        
        return specialCollectionRepository.save(sc); // Save updated collection
    }

    @Override
    public List<SpecialCollection> listUserCollections(String userId) { // Get collections for specific user
        return specialCollectionRepository.findByUserId(userId).stream() // Find collections by user ID
                .sorted((a, b) -> a.getDate().compareTo(b.getDate())) // Sort by date
                .collect(Collectors.toList()); // Collect to list
    }

    @Override
    public List<SpecialCollection> findAll() { // Get all collections
        System.out.println("SpecialCollectionServiceImpl.findAll() called");
        List<SpecialCollection> allCollections = specialCollectionRepository.findAll(); // Get all collections from database
        System.out.println("Repository returned " + allCollections.size() + " special collections");
        for (SpecialCollection sc : allCollections) { // Log collection details for debugging
            System.out.println("Collection ID: " + sc.getId() + ", Category: " + sc.getCategory() + ", Lat: " + sc.getLatitude() + ", Lng: " + sc.getLongitude());
        }
        return allCollections; // Return all collections
    }

    @Override
    public long count() { // Get total collection count
        System.out.println("SpecialCollectionServiceImpl.count() called");
        long count = specialCollectionRepository.count(); // Get count from database
        System.out.println("Repository count: " + count);
        return count; // Return count
    }

    @Override
    public SpecialCollection markPaid(String userId, String collectionId) { // Mark collection as paid
        SpecialCollection sc = specialCollectionRepository.findById(collectionId) // Find collection by ID
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        try {
            validator.validateUserAuthorization(sc, userId); // Validate user owns collection
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        sc.setPaymentStatus("Paid"); // Set payment status to paid
        SpecialCollection saved = specialCollectionRepository.save(sc); // Save updated collection
        
        emailHelper.sendPaymentNotification(userId, saved, "Mock", true); // Send payment notification email
        
        return saved; // Return updated collection
    }

    @Override
    public SpecialCollection markCashPending(String userId, String collectionId) { // Mark collection as cash pending
        SpecialCollection sc = specialCollectionRepository.findById(collectionId) // Find collection by ID
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        try {
            validator.validateUserAuthorization(sc, userId); // Validate user owns collection
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        sc.setPaymentStatus("Pending"); // Set payment status to pending
        sc.setStatus("Scheduled"); // Set collection status to scheduled
        SpecialCollection saved = specialCollectionRepository.save(sc); // Save updated collection
        
        emailHelper.sendPaymentNotification(userId, saved, "Cash", true); // Send cash payment notification email
        
        return saved; // Return updated collection
    }

    @Override
    public SpecialCollection markUnpaid(String userId, String collectionId, String method) { // Mark collection as unpaid
        SpecialCollection sc = specialCollectionRepository.findById(collectionId) // Find collection by ID
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        try {
            validator.validateUserAuthorization(sc, userId); // Validate user owns collection
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        sc.setPaymentStatus("Unpaid"); // Set payment status to unpaid
        SpecialCollection saved = specialCollectionRepository.save(sc); // Save updated collection
        
        emailHelper.sendPaymentNotification(userId, saved, method == null ? "Card" : method, false); // Send payment failure notification email
        
        return saved; // Return updated collection
    }

    @Override
    public SpecialCollection cancelCollection(String userId, String collectionId) { // Cancel and delete collection
        SpecialCollection sc = specialCollectionRepository.findById(collectionId) // Find collection by ID
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        try {
            validator.validateUserAuthorization(sc, userId); // Validate user owns collection
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        try {
            validator.validateCancellationRules(sc); // Validate cancellation rules
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        specialCollectionRepository.delete(sc); // Delete collection from database
        return sc; // Return deleted collection
    }

    @Override
    public SpecialCollection markCollected(String qrCodeData) { // Mark collection as collected via QR code scan
        SpecialCollectionMapper.QRCodeData parsedData; // QR code data object
        try {
            parsedData = mapper.parseQRCodeData(qrCodeData); // Parse QR code data
        } catch (RuntimeException e) {
            throw new CustomException(e.getMessage()); // Convert to custom exception
        }
        
        SpecialCollection sc = specialCollectionRepository.findById(parsedData.collectionId) // Find collection by ID from QR data
                .orElseThrow(() -> new CustomException("Collection not found")); // Throw exception if not found
        
        if (!sc.getUserId().equals(parsedData.userId)) { // Validate QR code matches collection
            throw new CustomException("QR code does not match collection"); // Throw exception if mismatch
        }
        
        if ("Collected".equals(sc.getStatus())) { // Check if already collected
            throw new CustomException("Collection has already been marked as collected"); // Throw exception if already collected
        }
        
        sc.setStatus("Collected"); // Set status to collected
        sc.setCollectedAt(LocalDateTime.now()); // Set collection timestamp
        SpecialCollection saved = specialCollectionRepository.save(sc); // Save updated collection
        
        emailHelper.sendCollectionCompletedNotification(parsedData.userId, saved); // Send completion notification email
        
        return saved; // Return updated collection
    }

    @Override
    public String generateQRCodeBase64(String collectionId, String userId) { // Generate QR code as base64 string
        try {
            System.out.println("Generating QR code for collection: " + collectionId + ", user: " + userId);
            String qrData = qrCodeService.generateCollectionQRData(collectionId, userId); // Generate QR code data
            System.out.println("Generated QR data: " + qrData);
            String base64 = qrCodeService.generateQRCodeBase64(qrData, 200, 200); // Generate base64 QR code
            System.out.println("Generated QR code base64 length: " + base64.length());
            return base64; // Return base64 string
        } catch (Exception e) { // Handle any errors
            System.err.println("Error generating QR code: " + e.getMessage());
            e.printStackTrace();
            throw new CustomException("Failed to generate QR code: " + e.getMessage()); // Throw custom exception
        }
    }

    @Override
    public byte[] generateQRCodeBytes(String collectionId, String userId) { // Generate QR code as byte array
        try {
            System.out.println("Generating QR code bytes for collection: " + collectionId + ", user: " + userId);
            String qrData = qrCodeService.generateCollectionQRData(collectionId, userId); // Generate QR code data
            System.out.println("Generated QR data: " + qrData);
            byte[] bytes = qrCodeService.generateQRCodeBytes(qrData, 200, 200); // Generate QR code bytes
            System.out.println("Generated QR code bytes length: " + bytes.length);
            return bytes; // Return byte array
        } catch (Exception e) { // Handle any errors
            System.err.println("Error generating QR code bytes: " + e.getMessage());
            e.printStackTrace();
            throw new CustomException("Failed to generate QR code: " + e.getMessage()); // Throw custom exception
        }
    }

    @Override
    public java.util.Optional<SpecialCollection> findBySimpleId(String id) { // Find collection by simple ID (6-digit ID)
        // First try to find by full collection ID if it looks like a full ObjectId (24 characters)
        if (id.length() == 24) { // Check if ID is full ObjectId length
            try {
                return specialCollectionRepository.findById(id); // Try to find by full ID
            } catch (Exception e) {
                // Continue to simple ID search
            }
        }
        
        // Try to find by simple ID (last 6 digits)
        List<SpecialCollection> allCollections = specialCollectionRepository.findAll(); // Get all collections
        return allCollections.stream() // Stream through collections
            .filter(collection -> { // Filter by simple ID match
                String collectionId = collection.getId(); // Get collection ID
                String simpleId = collectionId.length() >= 6 ? collectionId.substring(collectionId.length() - 6) : collectionId; // Extract last 6 digits
                return simpleId.equals(id); // Check if simple ID matches
            })
            .findFirst(); // Return first match
    }

    @Override
    public SpecialCollection update(SpecialCollection collection) { // Update existing collection
        return specialCollectionRepository.save(collection); // Save updated collection to database
    }

}


