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
}
