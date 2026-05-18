package com.splittrip.dashboard;

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

    public DashboardService(TripService tripService) {
        this.tripService = tripService;
    }

    //GJ>SS czekam na Twoja czesc z modulu expense
    //private final ExpenseService expenseService;

    public DashboardSummaryResponse getSummaryForUser(UUID userId) {
        List<Trip> userTrips = tripService.getUserTrips(userId);

        BigDecimal totalBudget = userTrips.stream()
                .map(Trip::getPlannedBudget)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        //GJ>SS tu tez do odkomentowania jak zrobisz...
        //List<RecentExpenseDto> recentExpenses = expenseService.getRecentExpensesForUser(userId, 5);
        //BudgetStatisticsDto stats = expenseService.getBudgetStatisticsForUser(userId);
        //
        //return new DashboardSummaryResponse(userTrips, totalBudget, recentExpenses, stats);

        //wtedy to ponizej usun:
        return new DashboardSummaryResponse(
                userTrips,
                totalBudget,
                List.of(),
                null
        );
    }
}
