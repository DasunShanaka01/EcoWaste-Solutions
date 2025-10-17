package com.example.backend.service;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.exception.CustomException;
import com.example.backend.model.SpecialCollection;
import com.example.backend.model.User;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialCollectionServiceImpl implements SpecialCollectionService {

    private final SpecialCollectionRepository specialCollectionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // capacity per slot (simple static capacity for demo)
    private static final int MAX_PER_SLOT = 10;
    private static final List<String> ALL_SLOTS = Arrays.asList("Morning", "Afternoon");

    public SpecialCollectionServiceImpl(SpecialCollectionRepository specialCollectionRepository,
                                        UserRepository userRepository,
                                        EmailService emailService) {
        this.specialCollectionRepository = specialCollectionRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Override
    public double calculateFee(FeeRequest req) {
        // Rates in LKR per kg (approximate, demo-friendly)
        double kg = Math.max(1, req.quantity);
        String cat = req.category == null ? "" : req.category.toLowerCase();
        switch (cat) {
            case "bulky":
                return 120.0 * kg; // LKR per kg
            case "hazardous":
                return 140.0 * kg;
            case "organic": // previously 'garden'
                return 80.0 * kg;
            case "e-waste":
                return 130.0 * kg;
            case "recyclable":
                return 40.0 * kg;
            case "other":
                return 100.0 * kg;
            default:
                return 120.0 * kg;
        }
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
        java.time.LocalDate d = java.time.LocalDate.parse(date);
        boolean weekend = d.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY;
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
    public SpecialCollection schedule(String userId, ScheduleRequest req) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException("User not found"));
        if (!user.isActive()) {
            throw new CustomException("Account is inactive");
        }
        if (user.isHasOverduePayments()) {
            throw new CustomException("Account has overdue payments");
        }
        // disallow if any unpaid special collection exists
        boolean hasUnpaid = specialCollectionRepository.existsByUserIdAndPaymentStatus(userId, "Unpaid");
        if (hasUnpaid) {
            throw new CustomException("You have an unpaid special collection. Please complete payment before scheduling a new one.");
        }
        // slot availability
        List<String> slots = getAvailableSlots(req.date);
        String storageSlot = req.timeSlot;
        if (req.timeSlot != null && req.timeSlot.toLowerCase().startsWith("morning")) storageSlot = "Morning";
        if (req.timeSlot != null && req.timeSlot.toLowerCase().startsWith("afternoon")) storageSlot = "Afternoon";
        boolean slotOk = slots.stream().anyMatch(s -> s.equalsIgnoreCase(req.timeSlot));
        if (!slotOk) {
            throw new CustomException("No slots available for selected date/time");
        }
        SpecialCollection sc = new SpecialCollection();
        sc.setUserId(userId);
        sc.setCategory(req.category);
        sc.setItems(req.items);
        sc.setQuantity(Math.max(1, req.quantity));
        sc.setDate(req.date);
        sc.setTimeSlot(storageSlot);
        sc.setLocation(req.location);
        if (req.coordinates != null) {
            sc.setLatitude(req.coordinates.latitude);
            sc.setLongitude(req.coordinates.longitude);
        }
        sc.setInstructions(req.instructions);
        sc.setFee(calculateFee(toFeeRequest(req)));
        sc.setStatus("Scheduled");
        sc.setPaymentStatus("Unpaid");
        SpecialCollection saved = specialCollectionRepository.save(sc);
        // send confirmation email
        emailService.sendSpecialCollectionConfirmation(user.getEmail(), saved.getId(), saved.getDate(), saved.getTimeSlot(), saved.getFee(), saved.getLocation());
        return saved;
    }

    @Override
    public SpecialCollection reschedule(String userId, String collectionId, String date, String timeSlot) {
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("Not authorized to modify this collection");
        }
        
        // Check if rescheduling is allowed (more than 24 hours before scheduled time)
        String storageSlot2 = timeSlot;
        try {
            LocalDate scheduledDate = LocalDate.parse(date);
            LocalDateTime scheduledDateTime = scheduledDate.atStartOfDay();
            
            // Add time based on slot
            if (timeSlot != null && timeSlot.toLowerCase().startsWith("morning")) {
                storageSlot2 = "Morning";
                scheduledDateTime = scheduledDate.atTime(9, 30); // Morning slot starts at 9:30
            } else if (timeSlot != null && timeSlot.toLowerCase().startsWith("afternoon")) {
                storageSlot2 = "Afternoon";
                scheduledDateTime = scheduledDate.atTime(15, 0); // Afternoon slot starts at 15:00
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime twentyFourHoursFromNow = now.plusHours(24);
            
            if (scheduledDateTime.isBefore(twentyFourHoursFromNow)) {
                throw new CustomException("Rescheduling is only allowed more than 24 hours before the scheduled time. Please schedule a new collection instead.");
            }
        } catch (Exception e) {
            if (e instanceof CustomException) {
                throw e;
            }
            throw new CustomException("Invalid date format or time calculation error");
        }
        
        // enforce availability
        boolean ok = getAvailableSlots(date).stream().anyMatch(s -> s.equalsIgnoreCase(timeSlot));
        if (!ok) {
            throw new CustomException("No slots available for selected date/time");
        }
        String existingStatus = sc.getStatus();
        String existingPaymentStatus = sc.getPaymentStatus();
        sc.setDate(date);
        sc.setTimeSlot(storageSlot2);
        sc.setStatus(existingStatus);
        sc.setPaymentStatus(existingPaymentStatus);
        return specialCollectionRepository.save(sc);
    }

    @Override
    public List<SpecialCollection> listUserCollections(String userId) {
        return specialCollectionRepository.findByUserId(userId).stream()
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
    }

    @Override
    public SpecialCollection markPaid(String userId, String collectionId) {
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("Not authorized to modify this collection");
        }
        sc.setPaymentStatus("Paid");
        SpecialCollection saved = specialCollectionRepository.save(sc);
        // send payment success email
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendPaymentNotification(user.getEmail(), saved.getId(), saved.getFee(), "Mock", true);
        }
        return saved;
    }

    @Override
    public SpecialCollection markCashPending(String userId, String collectionId) {
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("Not authorized to modify this collection");
        }
        // set paymentStatus Pending for cash until collected
        sc.setPaymentStatus("Pending");
        sc.setStatus("Scheduled");
        SpecialCollection saved = specialCollectionRepository.save(sc);
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendPaymentNotification(user.getEmail(), saved.getId(), saved.getFee(), "Cash", true);
        }
        return saved;
    }

    @Override
    public SpecialCollection markUnpaid(String userId, String collectionId, String method) {
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("Not authorized to modify this collection");
        }
        sc.setPaymentStatus("Unpaid");
        SpecialCollection saved = specialCollectionRepository.save(sc);
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendPaymentNotification(user.getEmail(), saved.getId(), saved.getFee(), method == null ? "Card" : method, false);
        }
        return saved;
    }

    @Override
    public SpecialCollection cancelCollection(String userId, String collectionId) {
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("Not authorized to modify this collection");
        }
        
        // Check if cancellation is allowed (more than 8 hours before scheduled time)
        try {
            LocalDate scheduledDate = LocalDate.parse(sc.getDate());
            LocalDateTime scheduledDateTime = scheduledDate.atStartOfDay();
            
            // Add time based on slot
            if (sc.getTimeSlot() != null && sc.getTimeSlot().toLowerCase().startsWith("morning")) {
                scheduledDateTime = scheduledDate.atTime(9, 30); // Morning slot starts at 9:30
            } else if (sc.getTimeSlot() != null && sc.getTimeSlot().toLowerCase().startsWith("afternoon")) {
                scheduledDateTime = scheduledDate.atTime(15, 0); // Afternoon slot starts at 15:00
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime eightHoursFromNow = now.plusHours(8);
            
            if (scheduledDateTime.isBefore(eightHoursFromNow)) {
                throw new CustomException("Cancellation is only allowed more than 8 hours before the scheduled time.");
            }
        } catch (Exception e) {
            if (e instanceof CustomException) {
                throw e;
            }
            throw new CustomException("Invalid date format or time calculation error");
        }
        
        // Delete the collection from database
        specialCollectionRepository.delete(sc);
        return sc; // Return the deleted collection for response
    }

    private FeeRequest toFeeRequest(ScheduleRequest req) {
        FeeRequest f = new FeeRequest();
        f.category = req.category;
        f.items = req.items;
        f.quantity = req.quantity;
        return f;
    }
}


