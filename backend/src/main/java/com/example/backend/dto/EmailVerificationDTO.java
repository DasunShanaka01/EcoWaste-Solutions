package com.example.backend.dto;

public class EmailVerificationDTO {
    private String email;
    private String code;

    // Default constructor
    public EmailVerificationDTO() {
    }

    // Constructor with parameters
    public EmailVerificationDTO(String email, String code) {
        this.email = email;
        this.code = code;
    }

    // Getters and setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
