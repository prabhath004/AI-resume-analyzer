package com.techsur.smartresume.payload;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String email;
    private String name;
    private String message;
} 