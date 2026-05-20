package com.splittrip.expense;

import com.splittrip.expense.ExpenseCategoryRepository;
import com.splittrip.currency.CurrencyConversionResponse;
import com.splittrip.currency.CurrencyService;
import com.splittrip.expense.dto.BudgetStatisticsDto;
import com.splittrip.expense.dto.CreateExpenseRequest;
import com.splittrip.expense.dto.RecentExpenseDto;
import com.splittrip.trip.Trip;
import com.splittrip.trip.TripMemberRepository;
import com.splittrip.trip.TripRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class ExpenseService {

    //Realizuje walidację autorstwa wydatków, przypisanie płatnika, wyliczanie kwoty bazowej oraz zapisywanie proporcji podziału między uczestników

    private final ExpenseRepository expenseRepository;
    private final CurrencyService currencyService;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    public ExpenseService(
        ExpenseRepository expenseRepository,
        TripRepository tripRepository,
        TripMemberRepository tripMemberRepository,
        CurrencyService currencyService,
        ExpenseCategoryRepository expenseCategoryRepository
) {
        this.expenseRepository = expenseRepository;
        this.currencyService = currencyService;
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
    }

    //Tworzenie nowego wydatku
    public Expense createExpense(CreateExpenseRequest request) {

        Trip trip =
        tripRepository.findById(request.tripId())
                .orElseThrow(() -> new RuntimeException(
                        "Nie znaleziono wycieczki o indexie: "
                                + request.tripId()
                ));

        CurrencyConversionResponse conversion =
                currencyService.convertCurrency(
                        request.currency(),
                        trip.getBaseCurrency(),
                        request.amount(),
                        request.expenseDate()
                );

        Expense expense = new Expense();

        expense.setTripId(request.tripId());
        expense.setPayerId(request.payerId());
        expense.setAmount(request.amount());
        expense.setCurrency(request.currency());
        expense.setAmountInBaseCurrency(
                conversion.getConvertedAmount()
        );
        ExpenseCategoryEntity category = expenseCategoryRepository.findById(request.categoryId()).orElseThrow(() -> new RuntimeException("Nie znaleziono kategorii wydatku o indeksie: " + request.categoryId()));
        expense.setCategory(category);
        expense.setDescription(request.description());
        expense.setExpenseDate(request.expenseDate());
        expense.setCreatedAt(LocalDateTime.now());

        return expenseRepository.save(expense);
    }

    //Lista wydatków podróży
    public List<Expense> getTripExpenses(UUID tripId) {

        return expenseRepository.findByTripId(tripId);
    }

    //Ostatnie wydatki użytkownika dla dashboardu
    public List<RecentExpenseDto> getRecentExpensesForUser(
            UUID userId,
            int limit
    ) {

        List<UUID> userTripIds =
                tripMemberRepository.findByIdUserId(userId)
                        .stream()
                        .map(member -> member.getId().getTripId())
                        .toList();

        return expenseRepository.findAll()
                .stream()
                .filter(expense ->
                        userTripIds.contains(expense.getTripId()))
                .sorted(Comparator.comparing(
                        Expense::getCreatedAt).reversed())
                .limit(limit)
                .map(expense ->
                        new RecentExpenseDto(
                                expense.getId(),
                                expense.getTripId(),
                                expense.getAmount(),
                                expense.getCurrency(),
                                expense.getExpenseDate(),
                                expense.getCategory().getName()
                        ))
                .toList();
    }

    //Statystyki budżetowe użytkownika
    public BudgetStatisticsDto getBudgetStatisticsForUser(
            UUID userId
    ) {

        List<UUID> tripIds =
                tripMemberRepository.findByIdUserId(userId)
                        .stream()
                        .map(member -> member.getId().getTripId())
                        .toList();

        List<Trip> trips =
        tripRepository.findAllById(tripIds);

        BigDecimal totalBudget =
                trips.stream()
                        .map(Trip::getPlannedBudget)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpent =
                expenseRepository.findAll()
                        .stream()
                        .filter(expense ->
                                tripIds.contains(expense.getTripId()))
                        .map(Expense::getAmountInBaseCurrency)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        double utilization = 0;

        if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {

            utilization =
                    totalSpent.divide(
                                    totalBudget,
                                    4,
                                    java.math.RoundingMode.HALF_UP
                            )
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue();
        }

        return new BudgetStatisticsDto(
                totalSpent,
                totalBudget,
                utilization
        );
    }
}