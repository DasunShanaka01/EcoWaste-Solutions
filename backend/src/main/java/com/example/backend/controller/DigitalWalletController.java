package com.example.backend.controller;

import com.example.backend.model.DigitalWallet;
import com.example.backend.service.DigitalWalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/digital-wallet")
public class DigitalWalletController {

    @Autowired
    private DigitalWalletService digitalWalletService;

    // Get digital wallet by user ID
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getDigitalWallet(@PathVariable String userId) {
        try {
            DigitalWallet wallet = digitalWalletService.getWallet(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("id", wallet.getId());
            response.put("userId", wallet.getUserId());
            response.put("points", wallet.getPoints());
            response.put("createdAt", wallet.getCreatedAt());
            response.put("updatedAt", wallet.getUpdatedAt());
            response.put("transactions", wallet.getTransactions());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch digital wallet: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Add points to digital wallet
    @PostMapping("/{userId}/add-points")
    public ResponseEntity<Map<String, Object>> addPoints(
            @PathVariable String userId,
            @RequestBody Map<String, Object> request) {
        try {
            Integer points = ((Number) request.get("points")).intValue();
            String description = (String) request.get("description");

            if (points == null || points <= 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Points must be a positive number");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            DigitalWallet wallet = digitalWalletService.addPoints(userId, points, description);

            Map<String, Object> response = new HashMap<>();
            response.put("id", wallet.getId());
            response.put("userId", wallet.getUserId());
            response.put("points", wallet.getPoints());
            response.put("message", "Points added successfully");

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to add points: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Deduct points from digital wallet
    @PostMapping("/{userId}/deduct-points")
    public ResponseEntity<Map<String, Object>> deductPoints(
            @PathVariable String userId,
            @RequestBody Map<String, Object> request) {
        try {
            Integer points = ((Number) request.get("points")).intValue();
            String description = (String) request.get("description");

            if (points == null || points <= 0) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Points must be a positive number");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            boolean success = digitalWalletService.deductPoints(userId, points, description);

            if (success) {
                DigitalWallet wallet = digitalWalletService.getWallet(userId);
                Map<String, Object> response = new HashMap<>();
                response.put("id", wallet.getId());
                response.put("userId", wallet.getUserId());
                response.put("points", wallet.getPoints());
                response.put("message", "Points deducted successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Insufficient points");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to deduct points: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get points balance only
    @GetMapping("/{userId}/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable String userId) {
        try {
            Integer points = digitalWalletService.getPoints(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("points", points);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get balance: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
