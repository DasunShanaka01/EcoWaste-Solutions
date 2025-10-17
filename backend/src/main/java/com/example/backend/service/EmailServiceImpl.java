package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;

    @Override
    public void sendVerificationToken(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Email Verification Code - Waste Management App");
        message.setText("Your verification code is: " + token
                + "\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.");
        mailSender.send(message);
    }

    @Override
    public void sendSpecialCollectionConfirmation(String email, String collectionId, String date, String timeSlot, double fee, String location) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Special Waste Collection Confirmation - " + collectionId);
        message.setText("Your special collection has been scheduled.\n\n"
                + "Collection ID: " + collectionId + "\n"
                + "Date: " + date + "\n"
                + "Time Slot: " + timeSlot + "\n"
                + "Pickup Location: " + location + "\n"
                + String.format("Total Fee: LKR %.2f\n\n", fee)
                + "Thank you for using EcoWaste Solutions.");
        mailSender.send(message);
    }

    @Override
    public void sendPaymentNotification(String email, String collectionId, double amount, String method, boolean success) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject((success ? "Payment Successful" : "Payment Failed") + " - " + collectionId);
        message.setText((success ? "Your payment was successful." : "Your payment failed.") + "\n\n"
                + "Collection ID: " + collectionId + "\n"
                + "Method: " + method + "\n"
                + String.format("Amount: LKR %.2f\n\n", amount)
                + (success ? "Thank you for your payment." : "Please try again or use another method."));
        mailSender.send(message);
    }
}
