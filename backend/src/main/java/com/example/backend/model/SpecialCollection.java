package com.example.backend.model;

import com.example.backend.model.enums.*;
import com.example.backend.model.valueobjects.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Refactored SpecialCollection class following SOLID principles
 * - Single Responsibility: Each method has a single, well-defined purpose
 * - Eliminates primitive obsession by using enums and value objects internally
 * - Maintains full backward compatibility with existing APIs
 * - All existing getters/setters work exactly as before
 */
@Document(collection = "special_collections")
public class SpecialCollection {
    @Id
    private String id;
    private String userId;
    
    // Original primitive fields - kept for backward compatibility
    private String category; // Bulky, Hazardous, Garden, E-Waste
    private String items; // short description or JSON string
    private int quantity;
    private double fee;
    private String date; // yyyy-MM-dd
    private String timeSlot; // Morning / Afternoon
    private String location;
    private Double latitude;
    private Double longitude;
    private String instructions;
    private String status = "Pending";
    private String paymentStatus = "Unpaid";
    private String paymentMethod; // Cash, Card, etc.
    private String qrCodeData; // QR code data for collection verification
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime collectedAt; // When the collection was completed

    // Internal type-safe representations (not stored in DB, not serialized)
    private transient WasteCategory categoryEnum;
    private transient CollectionStatus statusEnum;
    private transient PaymentStatus paymentStatusEnum;
    private transient TimeSlot timeSlotEnum;
    private transient PaymentMethod paymentMethodEnum;
    private transient Quantity quantityObject;
    private transient Money feeObject;
    private transient GeoLocation geoLocationObject;

    // ========== IDENTIFIER METHODS ==========
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    // ========== CATEGORY METHODS ==========
    
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
        this.categoryEnum = WasteCategory.fromString(category);
    }

    // Type-safe category access
    public WasteCategory getCategoryEnum() {
        if (categoryEnum == null && category != null) {
            categoryEnum = WasteCategory.fromString(category);
        }
        return categoryEnum;
    }

    public void setCategoryEnum(WasteCategory categoryEnum) {
        this.categoryEnum = categoryEnum;
        this.category = categoryEnum != null ? categoryEnum.toString() : null;
    }

    // ========== ITEMS METHODS ==========
    
    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    // ========== QUANTITY METHODS ==========
    
    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        this.quantityObject = new Quantity(quantity);
    }

    // Type-safe quantity access
    public Quantity getQuantityObject() {
        if (quantityObject == null) {
            quantityObject = new Quantity(quantity);
        }
        return quantityObject;
    }

    public void setQuantityObject(Quantity quantityObject) {
        this.quantityObject = quantityObject;
        this.quantity = quantityObject != null ? quantityObject.getValue() : 0;
    }

    // ========== FEE METHODS ==========
    
    public double getFee() {
        return fee;
    }

    public void setFee(double fee) {
        this.fee = fee;
        this.feeObject = new Money(fee);
    }

    // Type-safe fee access
    public Money getFeeObject() {
        if (feeObject == null) {
            feeObject = new Money(fee);
        }
        return feeObject;
    }

    public void setFeeObject(Money feeObject) {
        this.feeObject = feeObject;
        this.fee = feeObject != null ? feeObject.getDoubleValue() : 0.0;
    }

    // ========== DATE METHODS ==========
    
    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    // ========== TIME SLOT METHODS ==========
    
    public String getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
        this.timeSlotEnum = TimeSlot.fromString(timeSlot);
    }

    // Type-safe time slot access
    public TimeSlot getTimeSlotEnum() {
        if (timeSlotEnum == null && timeSlot != null) {
            timeSlotEnum = TimeSlot.fromString(timeSlot);
        }
        return timeSlotEnum;
    }

    public void setTimeSlotEnum(TimeSlot timeSlotEnum) {
        this.timeSlotEnum = timeSlotEnum;
        this.timeSlot = timeSlotEnum != null ? timeSlotEnum.toString() : null;
    }

    // ========== LOCATION METHODS ==========
    
    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    // ========== COORDINATES METHODS ==========
    
    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
        updateGeoLocationObject();
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
        updateGeoLocationObject();
    }

    // Type-safe coordinates access
    public GeoLocation getGeoLocationObject() {
        if (geoLocationObject == null && (latitude != null || longitude != null)) {
            geoLocationObject = new GeoLocation(latitude, longitude, location);
        }
        return geoLocationObject;
    }

    public void setGeoLocationObject(GeoLocation geoLocationObject) {
        this.geoLocationObject = geoLocationObject;
        if (geoLocationObject != null) {
            this.latitude = geoLocationObject.getLatitude();
            this.longitude = geoLocationObject.getLongitude();
            this.location = geoLocationObject.getAddress();
        }
    }

    private void updateGeoLocationObject() {
        if (latitude != null || longitude != null) {
            geoLocationObject = new GeoLocation(latitude, longitude, location);
        } else {
            geoLocationObject = null;
        }
    }

    // ========== INSTRUCTIONS METHODS ==========
    
    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    // ========== STATUS METHODS ==========
    
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.statusEnum = CollectionStatus.fromString(status);
    }

    // Type-safe status access
    public CollectionStatus getStatusEnum() {
        if (statusEnum == null && status != null) {
            statusEnum = CollectionStatus.fromString(status);
        }
        return statusEnum;
    }

    public void setStatusEnum(CollectionStatus statusEnum) {
        this.statusEnum = statusEnum;
        this.status = statusEnum != null ? statusEnum.toString() : null;
    }

    // ========== PAYMENT STATUS METHODS ==========
    
    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
        this.paymentStatusEnum = PaymentStatus.fromString(paymentStatus);
    }

    // Type-safe payment status access
    public PaymentStatus getPaymentStatusEnum() {
        if (paymentStatusEnum == null && paymentStatus != null) {
            paymentStatusEnum = PaymentStatus.fromString(paymentStatus);
        }
        return paymentStatusEnum;
    }

    public void setPaymentStatusEnum(PaymentStatus paymentStatusEnum) {
        this.paymentStatusEnum = paymentStatusEnum;
        this.paymentStatus = paymentStatusEnum != null ? paymentStatusEnum.toString() : null;
    }

    // ========== PAYMENT METHOD METHODS ==========
    
    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
        this.paymentMethodEnum = PaymentMethod.fromString(paymentMethod);
    }

    // Type-safe payment method access
    public PaymentMethod getPaymentMethodEnum() {
        if (paymentMethodEnum == null && paymentMethod != null) {
            paymentMethodEnum = PaymentMethod.fromString(paymentMethod);
        }
        return paymentMethodEnum;
    }

    public void setPaymentMethodEnum(PaymentMethod paymentMethodEnum) {
        this.paymentMethodEnum = paymentMethodEnum;
        this.paymentMethod = paymentMethodEnum != null ? paymentMethodEnum.toString() : null;
    }

    // ========== TIMESTAMP METHODS ==========
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(LocalDateTime collectedAt) {
        this.collectedAt = collectedAt;
    }

    // ========== QR CODE METHODS ==========
    
    public String getQrCodeData() {
        return qrCodeData;
    }

    public void setQrCodeData(String qrCodeData) {
        this.qrCodeData = qrCodeData;
    }

    // ========== BUSINESS LOGIC METHODS ==========
    
    /**
     * Checks if the collection is ready for pickup
     * @return true if collection is scheduled and paid
     */
    public boolean isReadyForPickup() {
        CollectionStatus status = getStatusEnum();
        PaymentStatus paymentStatus = getPaymentStatusEnum();
        return status == CollectionStatus.SCHEDULED && 
               paymentStatus == PaymentStatus.PAID;
    }

    /**
     * Checks if the collection can be cancelled
     * @return true if collection is not already completed or cancelled
     */
    public boolean canBeCancelled() {
        CollectionStatus status = getStatusEnum();
        return status != CollectionStatus.COLLECTED && 
               status != CollectionStatus.COMPLETED && 
               status != CollectionStatus.CANCELLED;
    }

    /**
     * Checks if the collection is overdue
     * @return true if collection date has passed and status is still pending/scheduled
     */
    public boolean isOverdue() {
        if (date == null) return false;
        
        try {
            java.time.LocalDate collectionDate = java.time.LocalDate.parse(date);
            java.time.LocalDate today = java.time.LocalDate.now();
            CollectionStatus status = getStatusEnum();
            
            return collectionDate.isBefore(today) && 
                   (status == CollectionStatus.PENDING || status == CollectionStatus.SCHEDULED);
        } catch (Exception e) {
            return false; // Invalid date format
        }
    }

    /**
     * Marks the collection as collected
     */
    public void markAsCollected() {
        setStatus("Collected");
        setCollectedAt(LocalDateTime.now());
    }

    /**
     * Checks if the collection has coordinates
     * @return true if both latitude and longitude are present
     */
    public boolean hasCoordinates() {
        return latitude != null && longitude != null;
    }

    /**
     * Gets the total weight in a formatted string
     * @return formatted weight string
     */
    public String getFormattedWeight() {
        Quantity qty = getQuantityObject();
        return qty != null ? qty.toString() : quantity + " kg";
    }

    /**
     * Gets the fee in a formatted string
     * @return formatted fee string
     */
    public String getFormattedFee() {
        Money fee = getFeeObject();
        return fee != null ? fee.toString() : String.format("LKR %.2f", this.fee);
    }

    /**
     * Validates the collection data
     * @return true if all required fields are valid
     */
    public boolean isValid() {
        return category != null && !category.trim().isEmpty() &&
               items != null && !items.trim().isEmpty() &&
               quantity > 0 &&
               date != null && !date.trim().isEmpty() &&
               timeSlot != null && !timeSlot.trim().isEmpty() &&
               location != null && !location.trim().isEmpty();
    }

    /**
     * Gets a summary of the collection for logging
     * @return formatted summary string
     */
    public String getSummary() {
        return String.format("Collection[ID=%s, Category=%s, Status=%s, Fee=%.2f]", 
                           id, category, status, fee);
    }
}
