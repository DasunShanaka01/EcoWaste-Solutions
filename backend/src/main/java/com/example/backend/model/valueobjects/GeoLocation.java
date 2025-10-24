package com.example.backend.model.valueobjects;

import java.util.Objects;

/**
 * Value object representing geographical coordinates
 * Encapsulates latitude and longitude with validation
 * Following Single Responsibility Principle - handles only location data
 */
public class GeoLocation {
    private Double latitude;
    private Double longitude;
    private String address;

    // Default constructor for MongoDB deserialization
    public GeoLocation() {
        this.latitude = null;
        this.longitude = null;
        this.address = null;
    }

    public GeoLocation(Double latitude, Double longitude, String address) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
    }

    public GeoLocation(Double latitude, Double longitude) {
        this(latitude, longitude, null);
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean hasCoordinates() {
        return latitude != null && longitude != null;
    }

    public boolean isValid() {
        return latitude != null && longitude != null &&
               latitude >= -90.0 && latitude <= 90.0 &&
               longitude >= -180.0 && longitude <= 180.0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GeoLocation that = (GeoLocation) o;
        return Objects.equals(latitude, that.latitude) &&
               Objects.equals(longitude, that.longitude) &&
               Objects.equals(address, that.address);
    }

    @Override
    public int hashCode() {
        return Objects.hash(latitude, longitude, address);
    }

    @Override
    public String toString() {
        return String.format("GeoLocation{lat=%.6f, lng=%.6f, address='%s'}", 
                           latitude, longitude, address);
    }
}
