package com.splittrip.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CurrentUserResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String provider;
}