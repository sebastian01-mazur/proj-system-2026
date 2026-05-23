package com.splittrip.dashboard;

import com.splittrip.expense.ExpenseService;
import com.splittrip.expense.dto.BudgetStatisticsDto;
import com.splittrip.expense.dto.RecentExpenseDto;
import com.splittrip.trip.Trip;
import com.splittrip.trip.TripService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class DashboardService {
    private final TripService tripService;

    public DashboardService(TripService tripService, ExpenseService expenseService) {
        this.tripService = tripService;
        this.expenseService = expenseService;
    }

    private final ExpenseService expenseService;

    public DashboardSummaryResponse getSummaryForUser(UUID userId) {
        List<Trip> userTrips = tripService.getUserTrips(userId);

        BigDecimal totalBudget = userTrips.stream()
                .map(Trip::getPlannedBudget)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<RecentExpenseDto> recentExpenses = expenseService.getRecentExpensesForUser(userId, 5);
        BudgetStatisticsDto stats = expenseService.getBudgetStatisticsForUser(userId);
        //
        return new DashboardSummaryResponse(userTrips, totalBudget, recentExpenses, stats);

    }
}
