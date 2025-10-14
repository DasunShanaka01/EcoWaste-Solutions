package com.example.backend.service;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.model.User;

public interface AuthService {
    User registerStep1(RegisterStep1DTO step1DTO);
    User registerStep2(String userId, RegisterStep2DTO step2DTO);
    User login(LoginDTO loginDTO);
     User findUserById(String id); // ✅ Add this
}
