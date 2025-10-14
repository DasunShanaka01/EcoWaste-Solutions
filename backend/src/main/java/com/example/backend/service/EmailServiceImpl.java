package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import lombok.RequiredArgsConstructor;

// @Service
// @RequiredArgsConstructor
// public class EmailServiceImpl implements EmailService {
//     private final JavaMailSender mailSender;

//     @Override
//     public void sendVerificationToken(String email, String token) {
//         SimpleMailMessage message = new SimpleMailMessage();
//         message.setTo(email);
//         message.setSubject("Your verification token");
//         message.setText("Use this code to verify your email: " + token);
//         mailSender.send(message);
//     }
//     
// }
