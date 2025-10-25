package com.example.backend.service;

import java.util.List;

//Interface for scheduling operations.
public interface SpecialCollectionSchedulingService {
    
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
}
