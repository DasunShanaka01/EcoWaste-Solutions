package com.example.backend.service;

import com.example.backend.model.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    Optional<User> getUserById(String id);
    User createUser(User user);
    User updateUser(String id, User user);
    void deleteUser(String id);
    List<User> getUsersByRole(String role);
    List<User> getActiveUsers();
    User updateUserStatus(String id, boolean active);
}