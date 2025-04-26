package com.techsur.smartresume.controller;

import com.techsur.smartresume.model.User;
import com.techsur.smartresume.payload.UserResponse;
import com.techsur.smartresume.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private AuthService authService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUserProfile() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(UserResponse.fromUser(currentUser));
    }
} 