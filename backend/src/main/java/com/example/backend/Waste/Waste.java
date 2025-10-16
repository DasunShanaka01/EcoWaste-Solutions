package com.example.backend.Waste;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Document(collection = "wastes")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Waste {

    @Id
    private ObjectId id;
    private String userId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private LocalDateTime submissionDate;
    private String submissionMethod; // "Home Pickup" or "Drop-off"
    private String status; // "Pending", "Processed", "Completed"
    private PickupDetails pickup;
    private double totalWeightKg;
    private double totalPaybackAmount;
    private String paymentMethod;
    private String paymentStatus;
    private List<Item> items;
    private String imageUrl;

    // New field: GPS location
    private GeoLocation location;

    // QR Code field for waste tracking
    private String qrCodeBase64;

    // Get date in system default format
    public String getFormattedSubmissionDate() {
        return submissionDate != null ? submissionDate.toLocalDate().toString() : null;
    }

    // --- Inner classes ---
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PickupDetails {
        private boolean required;
        private String date; // Store as String to avoid Jackson LocalDate issues
        private String timeSlot;
        private String address;
        private String city;
        private String zipCode;

        // Helper method to get LocalDate if needed
        public LocalDate getDateAsLocalDate() {
            if (date != null && !date.isEmpty()) {
                return LocalDate.parse(date);
            }
            return null;
        }

        // Helper method to set date from LocalDate
        public void setDateFromLocalDate(LocalDate localDate) {
            this.date = localDate != null ? localDate.toString() : null;
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Item {
        private String category;
        private String itemType;
        private String itemDescription;
        private int quantity;
        private double estimatedWeightKg;
        private double estimatedPayback;
    }

    // New inner class for storing real coordinates
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GeoLocation {
        private double latitude;
        private double longitude;
        private String address; // Added address field for location description
    }
}