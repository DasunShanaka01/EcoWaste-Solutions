package com.example.backend.util;

import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.model.SpecialCollection;
import com.example.backend.model.User;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

//Helper class for SpecialCollection validation logic.
@Component
public class SpecialCollectionValidator {
    
    private final UserRepository userRepository;
    private final SpecialCollectionRepository specialCollectionRepository;
    
    public SpecialCollectionValidator(UserRepository userRepository, 
                                    SpecialCollectionRepository specialCollectionRepository) {
        this.userRepository = userRepository;
        this.specialCollectionRepository = specialCollectionRepository;
    }
    
   
     //Validates user eligibility for scheduling collections.
    public void validateUserEligibility(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.isActive()) {
            throw new RuntimeException("Account is inactive");
        }
        
        if (user.isHasOverduePayments()) {
            throw new RuntimeException("Account has overdue payments");
        }
        
        // Check for unpaid collections
        boolean hasUnpaid = specialCollectionRepository.existsByUserIdAndPaymentStatus(userId, "Unpaid");
        if (hasUnpaid) {
            throw new RuntimeException("You have an unpaid special collection. Please complete payment before scheduling a new one.");
        }
    }
    
    //Validates schedule request data.
    public void validateScheduleRequest(ScheduleRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Schedule request cannot be null");
        }
        
        validateCategory(request.category);
        validateItems(request.items);
        validateQuantity(request.quantity);
        validateDate(request.date);
        validateTimeSlot(request.timeSlot);
        validateLocation(request.location);
    }
    
    //Validates slot availability for a given date and time.
    public void validateSlotAvailability(String date, String timeSlot, java.util.List<String> availableSlots) {
        boolean slotAvailable = availableSlots.stream()
                .anyMatch(slot -> slot.equalsIgnoreCase(timeSlot));
        
        if (!slotAvailable) {
            throw new RuntimeException("No slots available for selected date/time");
        }
    }
    
    //Validates rescheduling rules (24-hour rule).
    public void validateReschedulingRules(String date, String timeSlot) {
        try {
            LocalDate scheduledDate = LocalDate.parse(date);
            LocalDateTime scheduledDateTime = calculateScheduledDateTime(scheduledDate, timeSlot);
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime twentyFourHoursFromNow = now.plusHours(24);
            
            if (scheduledDateTime.isBefore(twentyFourHoursFromNow)) {
                throw new RuntimeException("Rescheduling is only allowed more than 24 hours before the scheduled time. Please schedule a new collection instead.");
            }
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format: " + date);
        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Invalid date format or time calculation error");
        }
    }
    
    //Validates cancellation rules (8-hour rule).
    public void validateCancellationRules(SpecialCollection collection) {
        try {
            LocalDate scheduledDate = LocalDate.parse(collection.getDate());
            LocalDateTime scheduledDateTime = calculateScheduledDateTime(scheduledDate, collection.getTimeSlot());
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime eightHoursFromNow = now.plusHours(8);
            
            if (scheduledDateTime.isBefore(eightHoursFromNow)) {
                throw new RuntimeException("Cancellation is only allowed more than 8 hours before the scheduled time.");
            }
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format in collection: " + collection.getDate());
        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Invalid date format or time calculation error");
        }
    }
    
    //Validates user authorization for collection modification.
    public void validateUserAuthorization(SpecialCollection collection, String userId) {
        if (collection == null) {
            throw new IllegalArgumentException("Collection cannot be null");
        }
        
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        if (!collection.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to modify this collection");
        }
    }
    
    // Private validation methods - each with single responsibility
    
    private void validateCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Category cannot be null or empty");
        }
    }
    
    private void validateItems(String items) {
        if (items == null || items.trim().isEmpty()) {
            throw new IllegalArgumentException("Items description cannot be null or empty");
        }
    }
    
    private void validateQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
    }
    
    private void validateDate(String date) {
        if (date == null || date.trim().isEmpty()) {
            throw new IllegalArgumentException("Date cannot be null or empty");
        }
        
        try {
            LocalDate.parse(date);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format. Expected yyyy-MM-dd");
        }
    }
    
    private void validateTimeSlot(String timeSlot) {
        if (timeSlot == null || timeSlot.trim().isEmpty()) {
            throw new IllegalArgumentException("Time slot cannot be null or empty");
        }
    }
    
    private void validateLocation(String location) {
        if (location == null || location.trim().isEmpty()) {
            throw new IllegalArgumentException("Location cannot be null or empty");
        }
    }
    
    private LocalDateTime calculateScheduledDateTime(LocalDate scheduledDate, String timeSlot) {
        LocalDateTime scheduledDateTime = scheduledDate.atStartOfDay();
        
        if (timeSlot != null && timeSlot.toLowerCase().startsWith("morning")) {
            scheduledDateTime = scheduledDate.atTime(9, 30);
        } else if (timeSlot != null && timeSlot.toLowerCase().startsWith("afternoon")) {
            scheduledDateTime = scheduledDate.atTime(15, 0);
        }
        
        return scheduledDateTime;
    }
}
