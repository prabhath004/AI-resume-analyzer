package com.techsur.smartresume.service;

import com.techsur.smartresume.model.User;
import com.techsur.smartresume.payload.AuthResponse;
import com.techsur.smartresume.payload.LoginRequest;
import com.techsur.smartresume.payload.SignupRequest;
import com.techsur.smartresume.repository.UserRepository;
import com.techsur.smartresume.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse signup(SignupRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                .success(false)
                .message("Email is already registered")
                .build();
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        User savedUser = userRepository.save(user);

        // Generate token
        String token = tokenProvider.generateToken(savedUser);

        return AuthResponse.builder()
            .token(token)
            .email(savedUser.getEmail())
            .name(savedUser.getName())
            .success(true)
            .message("User registered successfully")
            .build();
    }

    public AuthResponse signin(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = (User) authentication.getPrincipal();
            String token = tokenProvider.generateToken(user);

            return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .success(true)
                .message("Logged in successfully")
                .build();

        } catch (Exception e) {
            return AuthResponse.builder()
                .success(false)
                .message("Invalid email or password")
                .build();
        }
    }

    public void signout() {
        SecurityContextHolder.clearContext();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }
        return (User) authentication.getPrincipal();
    }
} 