package com.example.backend.controller;

import com.example.backend.dto.RegisterStep1DTO;
import com.example.backend.dto.RegisterStep2DTO;
import com.example.backend.dto.LoginDTO;
import com.example.backend.model.User;
import com.example.backend.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register/step1")
    public User registerStep1(@RequestBody RegisterStep1DTO step1DTO) {
        return authService.registerStep1(step1DTO);
    }

    @PostMapping("/register/step2/{userId}")
    public User registerStep2(@PathVariable String userId,
                              @RequestBody RegisterStep2DTO step2DTO) {
        return authService.registerStep2(userId, step2DTO);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginDTO loginDTO, HttpServletResponse response) {
        User user = authService.login(loginDTO);
        Cookie cookie = new Cookie("SESSIONID", user.getId());
        cookie.setHttpOnly(true);
        cookie.setMaxAge(28 * 24 * 60 * 60); // 28 days
        cookie.setPath("/");
        response.addCookie(cookie);
        return "Login successful";
    }
}
