package com.example.backend.validator;

import com.example.backend.Waste.Waste;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * Validator for recyclable waste submissions
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling validation logic for recyclable waste
 * - Open/Closed Principle (OCP): Validation rules can be extended by adding new
 * methods without modifying existing code
 * - Interface Segregation Principle (ISP): Provides focused validation methods
 * rather than one large validation method
 * - Dependency Inversion Principle (DIP): No dependencies on concrete
 * implementations, pure validation logic
 */
@Component
public class RecyclableWasteValidator {

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Centralized configuration for file validation rules
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_FILE_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif");

    /**
     * Validate waste submission data
     * 
     * @param waste Waste object to validate
     * @return List of validation errors
     */
    public List<String> validateWasteSubmission(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating waste submission data
        List<String> errors = new ArrayList<>();

        if (waste == null) {
            errors.add("Waste object cannot be null");
            return errors;
        }

        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // Each validation block has a single responsibility
        // Validate user information
        if (waste.getUserId() == null || waste.getUserId().trim().isEmpty()) {
            errors.add("User ID is required");
        }

        if (waste.getFullName() == null || waste.getFullName().trim().isEmpty()) {
            errors.add("Full name is required");
        }

        if (waste.getPhoneNumber() == null || waste.getPhoneNumber().trim().isEmpty()) {
            errors.add("Phone number is required");
        }

        if (waste.getEmail() == null || waste.getEmail().trim().isEmpty()) {
            errors.add("Email is required");
        } else if (!isValidEmail(waste.getEmail())) {
            errors.add("Invalid email format");
        }

        // Validate submission method
        if (waste.getSubmissionMethod() == null || waste.getSubmissionMethod().trim().isEmpty()) {
            errors.add("Submission method is required");
        } else if (!isValidSubmissionMethod(waste.getSubmissionMethod())) {
            errors.add("Invalid submission method: " + waste.getSubmissionMethod());
        }

        // Validate weight
        if (waste.getTotalWeightKg() <= 0) {
            errors.add("Weight must be greater than 0");
        }

        // Validate items
        if (waste.getItems() == null || waste.getItems().isEmpty()) {
            errors.add("At least one item is required");
        } else {
            for (int i = 0; i < waste.getItems().size(); i++) {
                Waste.Item item = waste.getItems().get(i);
                if (item.getCategory() == null || item.getCategory().trim().isEmpty()) {
                    errors.add("Item " + (i + 1) + " category is required");
                }
                if (item.getEstimatedWeightKg() <= 0) {
                    errors.add("Item " + (i + 1) + " weight must be greater than 0");
                }
            }
        }

        // Validate payback method
        if (waste.getPaybackMethod() == null || waste.getPaybackMethod().trim().isEmpty()) {
            errors.add("Payback method is required");
        } else if (!isValidPaybackMethod(waste.getPaybackMethod())) {
            errors.add("Invalid payback method: " + waste.getPaybackMethod());
        }

        // SOLID PRINCIPLE: Open/Closed Principle (OCP)
        // Validation logic is extensible - new validation rules can be added without
        // modifying existing code
        // Validate payback method specific details
        if ("Bank Transfer".equals(waste.getPaybackMethod())) {
            validateBankTransferDetails(waste, errors);
        } else if ("Donation".equals(waste.getPaybackMethod())) {
            validateDonationDetails(waste, errors);
        }

        // Validate pickup details for home pickup
        if ("Home Pickup".equals(waste.getSubmissionMethod())) {
            validatePickupDetails(waste, errors);
        }

        return errors;
    }

    /**
     * Validate uploaded file
     * 
     * @param file MultipartFile to validate
     * @return List of validation errors
     */
    public List<String> validateFileUpload(MultipartFile file) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating file uploads
        List<String> errors = new ArrayList<>();

        if (file == null || file.isEmpty()) {
            return errors; // File is optional
        }

        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // Each validation check has a single responsibility
        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            errors.add("File size exceeds maximum limit of 5MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType)) {
            errors.add("Invalid file type. Only JPEG, PNG, and GIF images are allowed");
        }

        return errors;
    }

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Each private method has a single responsibility - validating specific aspects
    private void validateBankTransferDetails(Waste waste, List<String> errors) {
        Waste.BankTransferDetails details = waste.getBankTransferDetails();
        if (details == null) {
            errors.add("Bank transfer details are required for bank transfer payback method");
            return;
        }

        if (details.getBankName() == null || details.getBankName().trim().isEmpty()) {
            errors.add("Bank name is required for bank transfer");
        }

        if (details.getAccountNumber() == null || details.getAccountNumber().trim().isEmpty()) {
            errors.add("Account number is required for bank transfer");
        }

        if (details.getAccountHolderName() == null || details.getAccountHolderName().trim().isEmpty()) {
            errors.add("Account holder name is required for bank transfer");
        }
    }

    private void validateDonationDetails(Waste waste, List<String> errors) {
        if (waste.getCharityOrganization() == null || waste.getCharityOrganization().trim().isEmpty()) {
            errors.add("Charity organization is required for donation payback method");
        }
    }

    private void validatePickupDetails(Waste waste, List<String> errors) {
        Waste.PickupDetails pickup = waste.getPickup();
        if (pickup == null) {
            errors.add("Pickup details are required for home pickup submission method");
            return;
        }

        if (pickup.getDate() == null || pickup.getDate().trim().isEmpty()) {
            errors.add("Pickup date is required for home pickup");
        }

        if (pickup.getTimeSlot() == null || pickup.getTimeSlot().trim().isEmpty()) {
            errors.add("Pickup time slot is required for home pickup");
        }
    }

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Each validation helper method has a single responsibility
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");
    }

    private boolean isValidSubmissionMethod(String method) {
        return "Home Pickup".equals(method) || "Drop-off".equals(method);
    }

    private boolean isValidPaybackMethod(String method) {
        return "Bank Transfer".equals(method) ||
                "Digital Wallet".equals(method) ||
                "Donation".equals(method);
    }
}
