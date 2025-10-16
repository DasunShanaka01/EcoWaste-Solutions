package com.example.backend.service;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.dto.UpdateProfileDTO;
import com.example.backend.dto.ChangePasswordDTO;
import com.example.backend.exception.CustomException;
import com.example.backend.model.User;
import com.example.backend.model.VerificationToken;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Random;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private EmailService emailService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public User registerStep1(RegisterStep1DTO step1DTO) {
        // Check if email already exists
        if (userRepository.existsByEmail(step1DTO.getEmail())) {
            throw new CustomException("Email already exists");
        }

        User user = new User();
        user.setName(step1DTO.getName());
        user.setPhone(step1DTO.getPhone());
        user.setEmail(step1DTO.getEmail());
        user.setEmailVerified(false);
        user.setCreatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Override
    public User registerStep2(String userId, RegisterStep2DTO step2DTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found for step 2"));

        if (!user.isEmailVerified()) {
            throw new CustomException("Email not verified");
        }

        user.setPassword(passwordEncoder.encode(step2DTO.getPassword()));
        user.setRole("USER"); // Default role for regular users
        return userRepository.save(user);
    }

    @Override
    public User login(LoginDTO loginDTO) {
        // Handle special admin and collector credentials
        if ("admin@gmail.com".equals(loginDTO.getEmail()) && "admin123".equals(loginDTO.getPassword())) {
            User adminUser = new User();
            adminUser.setId("admin-001");
            adminUser.setName("Admin");
            adminUser.setEmail("admin@gmail.com");
            adminUser.setRole("ADMIN");
            adminUser.setEmailVerified(true);
            adminUser.setCreatedAt(Instant.now());
            return adminUser;
        }

        if (("kamal@gmail.com".equals(loginDTO.getEmail()) && "kamal123".equals(loginDTO.getPassword())) ||
                ("sunil@gmail.com".equals(loginDTO.getEmail()) && "sunil123".equals(loginDTO.getPassword()))) {
            User collectorUser = new User();
            collectorUser.setId("collector-" + (loginDTO.getEmail().equals("kamal@gmail.com") ? "001" : "002"));
            collectorUser.setName(loginDTO.getEmail().equals("kamal@gmail.com") ? "Kamal" : "Sunil");
            collectorUser.setEmail(loginDTO.getEmail());
            collectorUser.setRole("COLLECTOR");
            collectorUser.setEmailVerified(true);
            collectorUser.setCreatedAt(Instant.now());
            return collectorUser;
        }

        // Regular user login
        User user = userRepository.findByEmail(loginDTO.getEmail())
                .orElseThrow(() -> new CustomException("Invalid email or password"));
        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new CustomException("Invalid email or password");
        }
        return user;
    }

    @Override
    public User findUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public void sendVerificationCode(String email) {
        // Generate 4-digit random code
        Random random = new Random();
        String code = String.format("%04d", random.nextInt(10000));

        // Delete any existing verification tokens for this email
        verificationTokenRepository.deleteByEmail(email);

        // Create new verification token
        VerificationToken token = VerificationToken.builder()
                .id(code)
                .email(email)
                .expiresAt(Instant.now().plusSeconds(600)) // 10 minutes
                .build();

        verificationTokenRepository.save(token);

        // Send email
        emailService.sendVerificationToken(email, code);
    }

    @Override
    public boolean verifyEmailCode(String email, String code) {
        VerificationToken token = verificationTokenRepository.findById(code).orElse(null);

        if (token == null || !token.getEmail().equals(email)) {
            return false;
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            verificationTokenRepository.delete(token);
            return false;
        }

        // Mark email as verified
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        // Delete the used token
        verificationTokenRepository.delete(token);
        return true;
    }

    @Override
    public User completeRegistration(String userId, RegisterStep2DTO step2DTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found"));

        if (!user.isEmailVerified()) {
            throw new CustomException("Email not verified");
        }

        user.setPassword(passwordEncoder.encode(step2DTO.getPassword()));
        user.setRole("USER"); // Default role for regular users
        return userRepository.save(user);
    }

    @Override
    public User updateProfile(String userId, UpdateProfileDTO updateProfileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found"));

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(updateProfileDTO.getEmail())) {
            if (userRepository.existsByEmail(updateProfileDTO.getEmail())) {
                throw new CustomException("Email already exists");
            }
            // If email is changed, mark as unverified
            user.setEmailVerified(false);
        }

        user.setName(updateProfileDTO.getName());
        user.setPhone(updateProfileDTO.getPhone());
        user.setEmail(updateProfileDTO.getEmail());

        return userRepository.save(user);
    }

    @Override
    public void changePassword(String userId, ChangePasswordDTO changePasswordDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(changePasswordDTO.getCurrentPassword(), user.getPassword())) {
            throw new CustomException("Current password is incorrect");
        }

        // Check if new password is different from current password
        if (passwordEncoder.matches(changePasswordDTO.getNewPassword(), user.getPassword())) {
            throw new CustomException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(changePasswordDTO.getNewPassword()));
        userRepository.save(user);
    }
}
