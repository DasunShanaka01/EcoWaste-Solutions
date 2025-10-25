package com.example.backend.util;

import com.example.backend.model.SpecialCollection;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.EmailService;
import org.springframework.stereotype.Component;

//Helper class for SpecialCollection email operations.
@Component
public class SpecialCollectionEmailHelper {
    
    private final EmailService emailService;
    private final UserRepository userRepository;
    
    public SpecialCollectionEmailHelper(EmailService emailService, UserRepository userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }
    
    //Sends collection confirmation email.
    public void sendConfirmationEmail(String userId, SpecialCollection collection) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendSpecialCollectionConfirmation(
                user.getEmail(), 
                collection.getId(), 
                collection.getDate(), 
                collection.getTimeSlot(), 
                collection.getFee(), 
                collection.getLocation()
            );
        }
    }
    
    //Sends payment notification email.
    public void sendPaymentNotification(String userId, SpecialCollection collection, String method, boolean success) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendPaymentNotification(
                user.getEmail(), 
                collection.getId(), 
                collection.getFee(), 
                method, 
                success
            );
        }
    }
    
    //Sends collection completed notification email.
    public void sendCollectionCompletedNotification(String userId, SpecialCollection collection) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            emailService.sendCollectionCompletedNotification(
                user.getEmail(), 
                collection.getId(), 
                collection.getDate(), 
                collection.getTimeSlot()
            );
        }
    }
}
