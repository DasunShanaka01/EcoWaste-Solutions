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
    private final QRCodeService qrCodeService;

    // capacity per slot (simple static capacity for demo)
    private static final int MAX_PER_SLOT = 10;
    private static final List<String> ALL_SLOTS = Arrays.asList("Morning", "Afternoon");

    public SpecialCollectionServiceImpl(SpecialCollectionRepository specialCollectionRepository,
                                        UserRepository userRepository,
                                        EmailService emailService) {
        this.specialCollectionRepository = specialCollectionRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
                                        EmailService emailService,
                                        QRCodeService qrCodeService) {
        this.specialCollectionRepository = specialCollectionRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.qrCodeService = qrCodeService;
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
        
        // Debug: Log the payment method received
        System.out.println("DEBUG: Received paymentMethod: " + req.paymentMethod);
        System.out.println("DEBUG: PaymentMethod is null: " + (req.paymentMethod == null));
        
        sc.setPaymentMethod(req.paymentMethod != null ? req.paymentMethod : "Card"); // Default to Card if not specified
        SpecialCollection saved = specialCollectionRepository.save(sc);
        
        // Generate QR code data for the collection
        String qrData = qrCodeService.generateCollectionQRData(saved.getId(), userId);
        saved.setQrCodeData(qrData);
        saved = specialCollectionRepository.save(saved);
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
        // simplistic window: must be >24h before (skip actual time calc for brevity)
        // enforce availability
        String storageSlot2 = timeSlot;
        if (timeSlot != null && timeSlot.toLowerCase().startsWith("morning")) storageSlot2 = "Morning";
        if (timeSlot != null && timeSlot.toLowerCase().startsWith("afternoon")) storageSlot2 = "Afternoon";
        
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
    public List<SpecialCollection> findAll() {
        System.out.println("SpecialCollectionServiceImpl.findAll() called");
        List<SpecialCollection> allCollections = specialCollectionRepository.findAll();
        System.out.println("Repository returned " + allCollections.size() + " special collections");
        for (SpecialCollection sc : allCollections) {
            System.out.println("Collection ID: " + sc.getId() + ", Category: " + sc.getCategory() + ", Lat: " + sc.getLatitude() + ", Lng: " + sc.getLongitude());
        }
        return allCollections;
    }

    @Override
    public long count() {
        System.out.println("SpecialCollectionServiceImpl.count() called");
        long count = specialCollectionRepository.count();
        System.out.println("Repository count: " + count);
        return count;
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

    @Override
    public SpecialCollection markCollected(String qrCodeData) {
        // Parse QR code data to extract collection ID and user ID
        if (!qrCodeData.startsWith("EWS_COLLECTION:")) {
            throw new CustomException("Invalid QR code format");
        }
        
        String[] parts = qrCodeData.split(":");
        if (parts.length != 3) {
            throw new CustomException("Invalid QR code data");
        }
        
        String collectionId = parts[1];
        String userId = parts[2];
        
        SpecialCollection sc = specialCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new CustomException("Collection not found"));
        
        if (!sc.getUserId().equals(userId)) {
            throw new CustomException("QR code does not match collection");
        }
        
        if ("Collected".equals(sc.getStatus())) {
            throw new CustomException("Collection has already been marked as collected");
        }
        
        sc.setStatus("Collected");
        sc.setCollectedAt(LocalDateTime.now());
        SpecialCollection saved = specialCollectionRepository.save(sc);
        
        // Send email notification to user
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendCollectionCompletedNotification(user.getEmail(), saved.getId(), saved.getDate(), saved.getTimeSlot());
        }
        
        return saved;
    }

    @Override
    public String generateQRCodeBase64(String collectionId, String userId) {
        try {
            System.out.println("Generating QR code for collection: " + collectionId + ", user: " + userId);
            String qrData = qrCodeService.generateCollectionQRData(collectionId, userId);
            System.out.println("Generated QR data: " + qrData);
            String base64 = qrCodeService.generateQRCodeBase64(qrData, 200, 200);
            System.out.println("Generated QR code base64 length: " + base64.length());
            return base64;
        } catch (Exception e) {
            System.err.println("Error generating QR code: " + e.getMessage());
            e.printStackTrace();
            throw new CustomException("Failed to generate QR code: " + e.getMessage());
        }
    }

    @Override
    public byte[] generateQRCodeBytes(String collectionId, String userId) {
        try {
            System.out.println("Generating QR code bytes for collection: " + collectionId + ", user: " + userId);
            String qrData = qrCodeService.generateCollectionQRData(collectionId, userId);
            System.out.println("Generated QR data: " + qrData);
            byte[] bytes = qrCodeService.generateQRCodeBytes(qrData, 200, 200);
            System.out.println("Generated QR code bytes length: " + bytes.length);
            return bytes;
        } catch (Exception e) {
            System.err.println("Error generating QR code bytes: " + e.getMessage());
            e.printStackTrace();
            throw new CustomException("Failed to generate QR code: " + e.getMessage());
        }
    }

    @Override
    public java.util.Optional<SpecialCollection> findBySimpleId(String id) {
        // First try to find by full collection ID if it looks like a full ObjectId (24 characters)
        if (id.length() == 24) {
            try {
                return specialCollectionRepository.findById(id);
            } catch (Exception e) {
                // Continue to simple ID search
            }
        }
        
        // Try to find by simple ID (last 6 digits)
        List<SpecialCollection> allCollections = specialCollectionRepository.findAll();
        return allCollections.stream()
            .filter(collection -> {
                String collectionId = collection.getId();
                String simpleId = collectionId.length() >= 6 ? collectionId.substring(collectionId.length() - 6) : collectionId;
                return simpleId.equals(id);
            })
            .findFirst();
    }

    @Override
    public SpecialCollection update(SpecialCollection collection) {
        return specialCollectionRepository.save(collection);
    }

    private FeeRequest toFeeRequest(ScheduleRequest req) {
        FeeRequest f = new FeeRequest();
        f.category = req.category;
        f.items = req.items;
        f.quantity = req.quantity;
        return f;
    }
}


