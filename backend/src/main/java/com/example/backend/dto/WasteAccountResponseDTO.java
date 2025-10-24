package com.example.backend.dto;

public class WasteAccountResponseDTO {
    private String accountId;
    private String qrCode;
    private LocationDTO location;
    private String createdAt;
    private double capacity;

    public WasteAccountResponseDTO() {
    }

    public WasteAccountResponseDTO(String accountId, String qrCode, LocationDTO location, String createdAt) {
        this.accountId = accountId;
        this.qrCode = qrCode;
        this.location = location;
        this.createdAt = createdAt;
        this.capacity = 0.0;
    }

    public WasteAccountResponseDTO(String accountId, String qrCode, LocationDTO location, String createdAt, double capacity) {
        this.accountId = accountId;
        this.qrCode = qrCode;
        this.location = location;
        this.createdAt = createdAt;
        this.capacity = capacity;
    }

    public static class LocationDTO {
        private double latitude;
        private double longitude;
        private String address;
        private String city;
        private String country;

        public LocationDTO() {
        }

        public LocationDTO(double latitude, double longitude, String address, String city, String country) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.city = city;
            this.country = country;
        }

        public double getLatitude() {
            return latitude;
        }

        public void setLatitude(double latitude) {
            this.latitude = latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public void setLongitude(double longitude) {
            this.longitude = longitude;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getCountry() {
            return country;
        }

        public void setCountry(String country) {
            this.country = country;
        }
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public LocationDTO getLocation() {
        return location;
    }

    public void setLocation(LocationDTO location) {
        this.location = location;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public double getCapacity() {
        return capacity;
    }

    public void setCapacity(double capacity) {
        this.capacity = capacity;
    }
}
