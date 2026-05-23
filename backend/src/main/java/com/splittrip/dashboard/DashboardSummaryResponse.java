package com.splittrip.dashboard;

import com.splittrip.expense.dto.BudgetStatisticsDto;
import com.splittrip.expense.dto.RecentExpenseDto;
import com.splittrip.trip.Trip;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        List<Trip> userTrips,
        BigDecimal totalPlannedBudget,
        List<RecentExpenseDto> recentExpenses,
        BudgetStatisticsDto budgetStats
) {}

