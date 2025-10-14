package com.example.backend.dto;

import lombok.Data;

@Data
public class UserResponseDTO {
    private String id;
    private String name;
    private String phone;
    private String email;
}
