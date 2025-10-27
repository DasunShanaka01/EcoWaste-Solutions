package com.example.backend.mapper;

import com.example.backend.Waste.Waste;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Mapper for converting between different data formats
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling data mapping operations
 * - Open/Closed Principle (OCP): Mapping logic can be extended by adding new
 * methods without modifying existing code
 * - Interface Segregation Principle (ISP): Provides focused mapping methods
 * rather than one large mapping method
 * - Dependency Inversion Principle (DIP): Depends on abstractions
 * (ObjectMapper) rather than concrete implementations
 */
@Component
public class RecyclableWasteMapper {

    // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
    // Depends on abstraction (ObjectMapper) rather than concrete implementation
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Map form data to Waste object
     * 
     * @param formData Map containing form data
     * @return Waste object
     */
    public Waste mapFormDataToWaste(Map<String, Object> formData) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - mapping form data to Waste object
        Waste waste = new Waste();

        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // Each mapping block has a single responsibility
        // Map basic fields
        waste.setUserId(getStringValue(formData, "userId"));
        waste.setFullName(getStringValue(formData, "fullName"));
        waste.setPhoneNumber(getStringValue(formData, "phoneNumber"));
        waste.setEmail(getStringValue(formData, "email"));
        waste.setSubmissionMethod(getStringValue(formData, "submissionMethod"));
        waste.setStatus(getStringValue(formData, "status", "Pending"));
        waste.setPaymentMethod(getStringValue(formData, "paymentMethod"));
        waste.setPaymentStatus(getStringValue(formData, "paymentStatus", "Pending"));
        waste.setPaybackMethod(getStringValue(formData, "paybackMethod"));

        // Map numeric fields
        waste.setTotalWeightKg(getDoubleValue(formData, "totalWeightKg"));
        waste.setTotalPaybackAmount(getDoubleValue(formData, "totalPaybackAmount"));

        // Map complex objects
        waste.setPickup(mapPickupDetails(formData.get("pickup")));
        waste.setItems(mapItems(formData.get("items")));
        waste.setLocation(mapLocation(formData.get("location")));
        waste.setBankTransferDetails(mapBankTransferDetails(formData.get("bankTransferDetails")));

        // Map payback method specific fields
        waste.setDigitalWalletPoints(getIntegerValue(formData, "digitalWalletPoints"));
        waste.setCharityOrganization(getStringValue(formData, "charityOrganization"));

        return waste;
    }

    /**
     * Map Waste object to response DTO
     * 
     * @param waste Waste object
     * @return Map containing response data
     */
    public Map<String, Object> mapWasteToResponse(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - mapping Waste object to response
        // DTO
        Map<String, Object> response = new java.util.HashMap<>();

        response.put("id", waste.getId().toString());
        response.put("userId", waste.getUserId());
        response.put("fullName", waste.getFullName());
        response.put("phoneNumber", waste.getPhoneNumber());
        response.put("email", waste.getEmail());
        response.put("submissionMethod", waste.getSubmissionMethod());
        response.put("status", waste.getStatus());
        response.put("paymentStatus", waste.getPaymentStatus());
        response.put("paybackMethod", waste.getPaybackMethod());
        response.put("totalWeightKg", waste.getTotalWeightKg());
        response.put("totalPaybackAmount", waste.getTotalPaybackAmount());
        response.put("actualWeightKg", waste.getActualWeightKg());
        response.put("actualPaybackAmount", waste.getActualPaybackAmount());
        response.put("submissionDate", waste.getSubmissionDate());
        response.put("items", waste.getItems());
        response.put("pickup", waste.getPickup());
        response.put("location", waste.getLocation());
        response.put("bankTransferDetails", waste.getBankTransferDetails());
        response.put("digitalWalletPoints", waste.getDigitalWalletPoints());
        response.put("charityOrganization", waste.getCharityOrganization());
        response.put("imageUrl", waste.getImageUrl());
        response.put("qrCodeBase64", waste.getQrCodeBase64());

        return response;
    }

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Each mapping method has a single responsibility - mapping specific data
    // structures
    private Waste.PickupDetails mapPickupDetails(Object pickupData) {
        if (pickupData == null) {
            return null;
        }

        try {
            if (pickupData instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> pickupMap = (Map<String, Object>) pickupData;
                Waste.PickupDetails pickup = new Waste.PickupDetails();
                pickup.setRequired(getBooleanValue(pickupMap, "required"));
                pickup.setDate(getStringValue(pickupMap, "date"));
                pickup.setTimeSlot(getStringValue(pickupMap, "timeSlot"));
                pickup.setAddress(getStringValue(pickupMap, "address"));
                pickup.setCity(getStringValue(pickupMap, "city"));
                pickup.setZipCode(getStringValue(pickupMap, "zipCode"));
                return pickup;
            } else if (pickupData instanceof String) {
                return objectMapper.readValue((String) pickupData, Waste.PickupDetails.class);
            }
        } catch (Exception e) {
            System.err.println("Error mapping pickup details: " + e.getMessage());
        }

        return null;
    }

    private List<Waste.Item> mapItems(Object itemsData) {
        if (itemsData == null) {
            return null;
        }

        try {
            if (itemsData instanceof List) {
                @SuppressWarnings("unchecked")
                List<Waste.Item> items = (List<Waste.Item>) itemsData;
                return items;
            } else if (itemsData instanceof String) {
                return objectMapper.readValue((String) itemsData,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Waste.Item.class));
            }
        } catch (Exception e) {
            System.err.println("Error mapping items: " + e.getMessage());
        }

        return null;
    }

    private Waste.GeoLocation mapLocation(Object locationData) {
        if (locationData == null) {
            return null;
        }

        try {
            if (locationData instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> locationMap = (Map<String, Object>) locationData;
                Waste.GeoLocation location = new Waste.GeoLocation();
                location.setLatitude(getDoubleValue(locationMap, "latitude"));
                location.setLongitude(getDoubleValue(locationMap, "longitude"));
                return location;
            } else if (locationData instanceof String) {
                return objectMapper.readValue((String) locationData, Waste.GeoLocation.class);
            }
        } catch (Exception e) {
            System.err.println("Error mapping location: " + e.getMessage());
        }

        return null;
    }

    private Waste.BankTransferDetails mapBankTransferDetails(Object bankData) {
        if (bankData == null) {
            return null;
        }

        try {
            if (bankData instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> bankMap = (Map<String, Object>) bankData;
                Waste.BankTransferDetails details = new Waste.BankTransferDetails();
                details.setBankName(getStringValue(bankMap, "bankName"));
                details.setAccountNumber(getStringValue(bankMap, "accountNumber"));
                details.setAccountHolderName(getStringValue(bankMap, "accountHolderName"));
                details.setBranchCode(getStringValue(bankMap, "branchCode"));
                return details;
            } else if (bankData instanceof String) {
                return objectMapper.readValue((String) bankData, Waste.BankTransferDetails.class);
            }
        } catch (Exception e) {
            System.err.println("Error mapping bank transfer details: " + e.getMessage());
        }

        return null;
    }

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Each helper method has a single responsibility - extracting specific data
    // types
    private String getStringValue(Map<String, Object> map, String key) {
        return getStringValue(map, key, null);
    }

    private String getStringValue(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }
        return 0.0;
    }

    private Integer getIntegerValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        } else if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private boolean getBooleanValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        } else if (value instanceof String) {
            return Boolean.parseBoolean((String) value);
        }
        return false;
    }
}
