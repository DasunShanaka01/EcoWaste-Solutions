package com.example.backend.strategy;

import java.util.List;

//Interface for scheduling operations.
public interface SchedulingStrategy {
    
    /**
     * Gets available dates for scheduling.
     * 
     * @param days Number of days to look ahead
     * @return List of available dates
     */
    List<String> getAvailableDates(int days);
    
    /**
     * Gets available time slots for a specific date.
     * 
     * @param date The date to check
     * @return List of available time slots
     */
    List<String> getAvailableSlots(String date);
    
    /**
     * Normalizes a time slot string to standard format.
     * 
     * @param timeSlot The time slot to normalize
     * @return Normalized time slot
     */
    String normalizeTimeSlot(String timeSlot);
}
