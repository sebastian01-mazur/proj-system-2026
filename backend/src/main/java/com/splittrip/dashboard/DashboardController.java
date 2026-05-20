package com.splittrip.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    //Agreguje dane o aktywnych podróżach użytkownika, ich sumarycznych budżetach oraz najnowszych wydatkach na jeden wspólny widok

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(@PathVariable UUID userId) {
        DashboardSummaryResponse summary = dashboardService.getSummaryForUser(userId);
        return ResponseEntity.ok(summary);
    }
}
