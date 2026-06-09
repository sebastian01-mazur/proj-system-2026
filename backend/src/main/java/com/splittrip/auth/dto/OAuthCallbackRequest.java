package com.splittrip.auth.dto;

import lombok.Data;

@Data
public class OAuthCallbackRequest {

    private String provider;
    private String code;
}
