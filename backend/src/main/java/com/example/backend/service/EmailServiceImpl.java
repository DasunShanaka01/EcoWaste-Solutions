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
        public void sendSpecialCollectionConfirmation(String email, String collectionId, String date, String timeSlot,
                        double fee, String location) {
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
        public void sendPaymentNotification(String email, String collectionId, double amount, String method,
                        boolean success) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject((success ? "Payment Successful" : "Payment Failed") + " - " + collectionId);
                message.setText((success ? "Your payment was successful." : "Your payment failed.") + "\n\n"
                                + "Collection ID: " + collectionId + "\n"
                                + "Method: " + method + "\n"
                                + String.format("Amount: LKR %.2f\n\n", amount)
                                + (success ? "Thank you for your payment."
                                                : "Please try again or use another method."));
                mailSender.send(message);
        }

        @Override
        public void sendReportEmail(String email, String reportTitle, String reportContent, String reportUrl) {
                try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setTo(email);
                        message.setSubject("Waste Management Report - " + reportTitle);
                        message.setText("Please find your requested report below:\n\n"
                                        + "Report: " + reportTitle + "\n"
                                        + "Generated on: "
                                        + java.time.LocalDateTime.now()
                                                        .format(java.time.format.DateTimeFormatter
                                                                        .ofPattern("yyyy-MM-dd HH:mm:ss"))
                                        + "\n\n"
                                        + "Report Summary:\n" + reportContent + "\n\n"
                                        + (reportUrl != null
                                                        ? "You can also view the report online at: " + reportUrl
                                                                        + "\n\n"
                                                        : "")
                                        + "Thank you for using EcoWaste Solutions.");
                        mailSender.send(message);
                        System.out.println("Email sent successfully to: " + email);
                } catch (Exception e) {
                        System.err.println("Error sending email to " + email + ": " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Failed to send email: " + e.getMessage());
                }
        }
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
    public void sendSpecialCollectionConfirmation(String email, String collectionId, String date, String timeSlot,
            double fee, String location) {
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
    public void sendPaymentNotification(String email, String collectionId, double amount, String method,
            boolean success) {
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

    @Override
    public void sendCollectionCompletedNotification(String email, String collectionId, String date, String timeSlot) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Collection Completed - " + collectionId);
        message.setText("Your special waste collection has been successfully completed!\n\n"
                + "Collection ID: " + collectionId + "\n"
                + "Scheduled Date: " + date + "\n"
                + "Time Slot: " + timeSlot + "\n"
                + "Completed At: " + java.time.LocalDateTime.now().toString() + "\n\n"
                + "Thank you for using EcoWaste Solutions. Your waste has been properly disposed of.");
        mailSender.send(message);
    }

    @Override
    public void sendRecyclableWasteCollectedNotification(String email, String wasteId, String category, double weight,
            double paybackAmount, String paybackMethod, String collectedAt) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Recyclable Waste Collected - " + wasteId);

        String paybackDetails = "";
        if (paybackMethod.equals("Bank Transfer")) {
            paybackDetails = "Your payback of LKR " + String.format("%.2f", paybackAmount)
                    + " will be transferred to your bank account within 3-5 business days.";
        } else if (paybackMethod.equals("Digital Wallet")) {
            paybackDetails = "Your payback of " + Math.round(paybackAmount)
                    + " points has been added to your digital wallet.";
        } else if (paybackMethod.equals("Donation")) {
            paybackDetails = "Your payback of LKR " + String.format("%.2f", paybackAmount)
                    + " has been donated to charity as requested.";
        }

        message.setText("Your recyclable waste has been successfully collected!\n\n"
                + "Waste ID: " + wasteId + "\n"
                + "Category: " + category + "\n"
                + "Weight: " + weight + " kg\n"
                + "Payback Amount: LKR " + String.format("%.2f", paybackAmount) + "\n"
                + "Payback Method: " + paybackMethod + "\n"
                + "Collected At: " + collectedAt + "\n\n"
                + paybackDetails + "\n\n"
                + "Thank you for contributing to environmental sustainability with EcoWaste Solutions!");
        mailSender.send(message);
    }
}
