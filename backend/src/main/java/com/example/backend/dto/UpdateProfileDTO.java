package com.example.backend.dto;

public class UpdateProfileDTO {
    private String name;
    private String phone;
    private String email;

    // Default constructor
    public UpdateProfileDTO() {
    }

    // Constructor with parameters
    public UpdateProfileDTO(String name, String phone, String email) {
        this.name = name;
        this.phone = phone;
        this.email = email;
    }

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
