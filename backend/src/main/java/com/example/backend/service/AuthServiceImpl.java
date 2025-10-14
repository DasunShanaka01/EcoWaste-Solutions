package com.example.backend.service;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.exception.CustomException;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public User registerStep1(RegisterStep1DTO step1DTO) {
        User user = new User();
        user.setName(step1DTO.getName());
        user.setPhone(step1DTO.getPhone());
        user.setCreatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Override
    public User registerStep2(String userId, RegisterStep2DTO step2DTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found for step 2"));
        if (userRepository.existsByEmail(step2DTO.getEmail())) {
            throw new CustomException("Email already exists");
        }
        user.setEmail(step2DTO.getEmail());
        user.setPassword(passwordEncoder.encode(step2DTO.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public User login(LoginDTO loginDTO) {
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

    
}
