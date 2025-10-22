package com.example.backend.service;

public interface EmailService {
    void sendVerificationToken(String email, String token);

    void sendSpecialCollectionConfirmation(String email, String collectionId, String date, String timeSlot, double fee,
            String location);

    void sendPaymentNotification(String email, String collectionId, double amount, String method, boolean success);

    void sendReportEmail(String email, String reportTitle, String reportContent, String reportUrl);
}
