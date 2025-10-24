package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

public class SpecialCollectionDTOs {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FeeRequest {
        public String category; // Bulky, Hazardous, Garden, E-Waste
        public String items;    // e.g., JSON or CSV short description
        public int quantity;
    }

    public static class FeeResponse {
        public double fee;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ScheduleRequest {
        public String category;
        public String items;
        public int quantity;
        public String date;     // yyyy-MM-dd
        public String timeSlot; // Morning or Afternoon
        public String location; // front door, garage, lobby
        public String instructions;
        public GeoLocation coordinates;
        public String instructions;
        public String paymentMethod; // Cash, Card, Bank, etc.
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeoLocation {
        public Double latitude;
        public Double longitude;
        public String address;
    }

    public static class ScheduleResponse {
        public String collectionId;
        public double fee;
        public String status; // Pending / Scheduled
        public String paymentStatus; // Unpaid / Paid
    }

    public static class SlotsResponse {
        public String date;
        public List<String> slots; // list of available slots for the date
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RescheduleRequest {
        public String date;     // yyyy-MM-dd
        public String timeSlot; // Morning or Afternoon
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PayRequest {
        public String method; // card | bank | cash
        public Boolean success; // when card/bank, indicate success (true) or failure (false)
    }
}


