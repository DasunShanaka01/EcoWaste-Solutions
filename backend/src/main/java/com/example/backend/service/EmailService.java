package com.example.backend.service;

public interface EmailService {
    void sendVerificationToken(String email, String token);
}
