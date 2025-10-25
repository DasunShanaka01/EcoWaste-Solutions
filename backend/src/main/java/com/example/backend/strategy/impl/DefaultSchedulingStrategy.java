package com.example.backend.strategy.impl;

import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.strategy.SchedulingStrategy;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Default implementation of SchedulingStrategy.
 */
@Component
public class DefaultSchedulingStrategy implements SchedulingStrategy {
    
    private final SpecialCollectionRepository specialCollectionRepository;
    
    private static final int MAX_PER_SLOT = 10;
    private static final List<String> ALL_SLOTS = Arrays.asList("Morning", "Afternoon");

    public DefaultSchedulingStrategy(SpecialCollectionRepository specialCollectionRepository) {
        this.specialCollectionRepository = specialCollectionRepository;
    }

    @Override
    public List<String> getAvailableDates(int days) {
        LocalDate today = LocalDate.now();
        List<String> dates = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            dates.add(today.plusDays(i).toString());
        }
        return dates;
    }

    @Override
    public List<String> getAvailableSlots(String date) {
        List<String> available = new ArrayList<>();
        LocalDate d = LocalDate.parse(date);
        boolean weekend = d.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || 
                         d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY;
        
        String morning = weekend ? "10.00-11.30" : "9.30-12.00";
        String afternoon = weekend ? "4.00-6.00" : "3.00-6.00";

        int morningBooked = specialCollectionRepository.findByDateAndTimeSlot(date, "Morning").size();
        if (morningBooked < MAX_PER_SLOT) {
            available.add("Morning " + morning);
        }
        
        int afternoonBooked = specialCollectionRepository.findByDateAndTimeSlot(date, "Afternoon").size();
        if (afternoonBooked < MAX_PER_SLOT) {
            available.add("Afternoon " + afternoon);
        }
        
        return available;
    }

    @Override
    public String normalizeTimeSlot(String timeSlot) {
        if (timeSlot == null) return null;
        if (timeSlot.toLowerCase().startsWith("morning")) return "Morning";
        if (timeSlot.toLowerCase().startsWith("afternoon")) return "Afternoon";
        return timeSlot;
    }
}
