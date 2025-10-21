package com.example.backend.controller;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.RegisterStep3DTO;
import com.example.backend.dto.WasteAccountResponseDTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.dto.EmailVerificationDTO;
import com.example.backend.dto.UpdateProfileDTO;
import com.example.backend.dto.ChangePasswordDTO;
import com.example.backend.model.User;
import com.example.backend.model.WasteAccount;
import com.example.backend.service.AuthService;
import com.example.backend.service.WasteAccountService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private WasteAccountService wasteAccountService;

    // STEP 1 Registration
    @PostMapping("/register/step1")
    public User registerStep1(@RequestBody RegisterStep1DTO step1DTO) {
        return authService.registerStep1(step1DTO);
    }

    // Send verification code
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerificationCode(@RequestBody EmailVerificationDTO emailDTO) {
        try {
            authService.sendVerificationCode(emailDTO.getEmail());
            return ResponseEntity.ok().body("Verification code sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Verify email code
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmailCode(@RequestBody EmailVerificationDTO verificationDTO) {
        try {
            boolean isValid = authService.verifyEmailCode(verificationDTO.getEmail(), verificationDTO.getCode());
            if (isValid) {
                return ResponseEntity.ok().body("Email verified successfully");
            } else {
                return ResponseEntity.badRequest().body("Invalid or expired verification code");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // STEP 2 Registration (Complete registration after email verification)
    @PostMapping("/register/step2/{userId}")
    public User registerStep2(@PathVariable String userId,
            @RequestBody RegisterStep2DTO step2DTO) {
        return authService.completeRegistration(userId, step2DTO);
    }

    // STEP 3 Registration (Create waste account)
    @PostMapping("/register/step3/{userId}")
    public WasteAccountResponseDTO registerStep3(@PathVariable String userId,
            @RequestBody RegisterStep3DTO step3DTO) {
        // Verify user exists
        User user = authService.findUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        // Create location object
        WasteAccount.Location location = new WasteAccount.Location(
            step3DTO.getLatitude(),
            step3DTO.getLongitude(),
            step3DTO.getAddress(),
            step3DTO.getCity(),
            step3DTO.getCountry()
        );
        
        // Create waste account
        WasteAccount wasteAccount = wasteAccountService.createWasteAccount(userId, location);
        
        // Convert to response DTO
        WasteAccountResponseDTO.LocationDTO locationDTO = new WasteAccountResponseDTO.LocationDTO(
            wasteAccount.getLocation().getLatitude(),
            wasteAccount.getLocation().getLongitude(),
            wasteAccount.getLocation().getAddress(),
            wasteAccount.getLocation().getCity(),
            wasteAccount.getLocation().getCountry()
        );
        
        return new WasteAccountResponseDTO(
            wasteAccount.getAccountId(),
            wasteAccount.getQrCode(),
            locationDTO,
            wasteAccount.getCreatedAt().toString(),
            wasteAccount.getCapacity()
        );
    }

    // ✅ LOGIN (Return full user)
    @PostMapping("/login")
    public User login(@RequestBody LoginDTO loginDTO, HttpServletResponse response) {
        User user = authService.login(loginDTO);

        // 🧁 Create SESSIONID cookie
        Cookie cookie = new Cookie("SESSIONID", user.getId());
        cookie.setHttpOnly(true);
        cookie.setMaxAge(28 * 24 * 60 * 60); // 28 days
        cookie.setPath("/");
        response.addCookie(cookie);

        // ✅ Return full user object to frontend
        return user;
    }

    // ✅ Check if user is authenticated (using SESSIONID cookie)
    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("SESSIONID".equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) {
                    User user = authService.findUserById(c.getValue());
                    if (user != null) {
                        return ResponseEntity.ok(user); // ✅ Return the user itself
                    }
                }
            }
        }
        return ResponseEntity.status(401).body("Not authenticated");
    }

    // Profile management endpoints
    @PostMapping("/profile/update/{userId}")
    public User updateProfile(@PathVariable String userId, @RequestBody UpdateProfileDTO updateProfileDTO) {
        return authService.updateProfile(userId, updateProfileDTO);
    }

    @PostMapping("/profile/change-password/{userId}")
    public ResponseEntity<?> changePassword(@PathVariable String userId,
            @RequestBody ChangePasswordDTO changePasswordDTO) {
        try {
            authService.changePassword(userId, changePasswordDTO);
            return ResponseEntity.ok().body("Password changed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get user's waste account
    @GetMapping("/waste-account/{userId}")
    public WasteAccountResponseDTO getWasteAccount(@PathVariable String userId) {
        WasteAccount wasteAccount = wasteAccountService.getWasteAccountByUserId(userId);
        
        // Convert to response DTO
        WasteAccountResponseDTO.LocationDTO locationDTO = new WasteAccountResponseDTO.LocationDTO(
            wasteAccount.getLocation().getLatitude(),
            wasteAccount.getLocation().getLongitude(),
            wasteAccount.getLocation().getAddress(),
            wasteAccount.getLocation().getCity(),
            wasteAccount.getLocation().getCountry()
        );
        
        return new WasteAccountResponseDTO(
            wasteAccount.getAccountId(),
            wasteAccount.getQrCode(),
            locationDTO,
            wasteAccount.getCreatedAt() != null ? wasteAccount.getCreatedAt().toString() : "Unknown",
            wasteAccount.getCapacity()
        );
    }

    // Get all waste accounts for collectors
    @GetMapping("/waste-accounts")
    public java.util.List<WasteAccountResponseDTO> getAllWasteAccounts() {
        java.util.List<WasteAccount> wasteAccounts = wasteAccountService.getAllWasteAccounts();
        return wasteAccounts.stream()
            .map(account -> {
                WasteAccountResponseDTO.LocationDTO locationDTO = new WasteAccountResponseDTO.LocationDTO(
                    account.getLocation().getLatitude(),
                    account.getLocation().getLongitude(),
                    account.getLocation().getAddress(),
                    account.getLocation().getCity(),
                    account.getLocation().getCountry()
                );
                
                return new WasteAccountResponseDTO(
                    account.getAccountId(),
                    account.getQrCode(),
                    locationDTO,
                    account.getCreatedAt() != null ? account.getCreatedAt().toString() : "Unknown",
                    account.getCapacity()
                );
            })
            .collect(java.util.stream.Collectors.toList());
    }

    // Auto-randomize capacity for waste accounts
    @PostMapping("/waste-accounts/randomize-capacity")
    public ResponseEntity<?> autoRandomizeCapacity(@RequestParam double percentage) {
        try {
            java.util.List<WasteAccount> updatedAccounts = wasteAccountService.autoRandomizeCapacity(percentage);
            return ResponseEntity.ok().body("Successfully randomized capacity for " + updatedAccounts.size() + " waste accounts");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Scan waste account QR code
    @PostMapping("/waste-accounts/scan-qr")
    public ResponseEntity<?> scanWasteAccountQR(@RequestBody java.util.Map<String, String> request) {
        try {
            String qrData = request.get("qrData");
            if (qrData == null || qrData.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("QR data is required");
            }

            // The QR code contains the accountId directly (generated in WasteAccountService)
            String accountId = qrData.trim();
            
            // Get waste account details
            java.util.Map<String, Object> accountDetails = wasteAccountService.getWasteAccountDetailsForScanning(accountId);
            
            return ResponseEntity.ok(accountDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error scanning QR code: " + e.getMessage());
        }
    }

    // Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear the SESSIONID cookie
        Cookie cookie = new Cookie("SESSIONID", null);
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0); // Delete the cookie
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok().body("Logged out successfully");
    }
}
