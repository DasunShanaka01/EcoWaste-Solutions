package com.example.backend.util;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.dto.SpecialCollectionDTOs.ScheduleRequest;
import com.example.backend.model.SpecialCollection;
import org.springframework.stereotype.Component;

//Helper class for SpecialCollection mapping and data transformation logic.
@Component
public class SpecialCollectionMapper {
    
    //Maps ScheduleRequest to FeeRequest for fee calculation.
    public FeeRequest toFeeRequest(ScheduleRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Schedule request cannot be null");
        }
        
        FeeRequest feeRequest = new FeeRequest();
        feeRequest.category = request.category;
        feeRequest.items = request.items;
        feeRequest.quantity = request.quantity;
        return feeRequest;
    }
    
    //Maps ScheduleRequest to SpecialCollection entity.
    public SpecialCollection mapToEntity(String userId, ScheduleRequest request, double calculatedFee) {
        if (request == null) {
            throw new IllegalArgumentException("Schedule request cannot be null");
        }
        
        SpecialCollection collection = new SpecialCollection();
        collection.setUserId(userId);
        collection.setCategory(request.category);
        collection.setItems(request.items);
        collection.setQuantity(Math.max(1, request.quantity));
        collection.setDate(request.date);
        collection.setTimeSlot(normalizeTimeSlot(request.timeSlot));
        collection.setLocation(request.location);
        
        // Handle coordinates mapping
        if (request.coordinates != null) {
            collection.setLatitude(request.coordinates.latitude);
            collection.setLongitude(request.coordinates.longitude);
        }
        
        collection.setInstructions(request.instructions);
        collection.setFee(calculatedFee);
        collection.setStatus("Scheduled");
        collection.setPaymentStatus("Unpaid");
        collection.setPaymentMethod(request.paymentMethod != null ? request.paymentMethod : "Card");
        
        return collection;
    }
    
    //Normalizes time slot string to standard format.
    public String normalizeTimeSlot(String timeSlot) {
        if (timeSlot == null) return null;
        if (timeSlot.toLowerCase().startsWith("morning")) return "Morning";
        if (timeSlot.toLowerCase().startsWith("afternoon")) return "Afternoon";
        return timeSlot;
    }
    
    //Updates collection schedule information.
    public void updateCollectionSchedule(SpecialCollection collection, String date, String timeSlot) {
        if (collection == null) {
            throw new IllegalArgumentException("Collection cannot be null");
        }
        
        String existingStatus = collection.getStatus();
        String existingPaymentStatus = collection.getPaymentStatus();
        collection.setDate(date);
        collection.setTimeSlot(normalizeTimeSlot(timeSlot));
        collection.setStatus(existingStatus);
        collection.setPaymentStatus(existingPaymentStatus);
    }
    
    //Parses QR code data to extract collection and user information.
    public QRCodeData parseQRCodeData(String qrCodeData) {
        if (qrCodeData == null || qrCodeData.trim().isEmpty()) {
            throw new IllegalArgumentException("QR code data cannot be null or empty");
        }
        
        if (!qrCodeData.startsWith("EWS_COLLECTION:")) {
            throw new RuntimeException("Invalid QR code format");
        }
        
        String[] parts = qrCodeData.split(":");
        if (parts.length != 3) {
            throw new RuntimeException("Invalid QR code data");
        }
        
        return new QRCodeData(parts[1], parts[2]);
    }
    
    //Data class for QR code information.
    public static class QRCodeData {
        public final String collectionId;
        public final String userId;
        
        public QRCodeData(String collectionId, String userId) {
            this.collectionId = collectionId;
            this.userId = userId;
        }
    }
}
