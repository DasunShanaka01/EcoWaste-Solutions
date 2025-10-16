package com.example.backend.controller;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.dto.EmailVerificationDTO;
import com.example.backend.dto.UpdateProfileDTO;
import com.example.backend.dto.ChangePasswordDTO;
import com.example.backend.model.User;
import com.example.backend.service.AuthService;
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
