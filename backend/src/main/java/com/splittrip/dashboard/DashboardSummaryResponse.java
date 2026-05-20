package com.splittrip.dashboard;

import com.splittrip.trip.Trip;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        List<Trip> userTrips,
        BigDecimal totalPlannedBudget,
        List<Object> recentExpenses,
        Object budgetStats
) {}

