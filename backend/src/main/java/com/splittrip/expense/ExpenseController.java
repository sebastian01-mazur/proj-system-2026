package com.splittrip.expense;

import com.splittrip.expense.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    //Obsługuje operacje CRUD na wydatkach: dodawanie nowych kosztów, ich edycję, usuwanie oraz wyświetlanie listy

    private final ExpenseService expenseService;
    private final ExpenseSettlementService expenseSettlementService;

    public ExpenseController(ExpenseService expenseService, ExpenseSettlementService expenseSettlementService) {
        this.expenseService = expenseService;
        this.expenseSettlementService = expenseSettlementService;
    }

    //Dodawanie wydatku
    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @RequestBody CreateExpenseRequest request
    ) {

        return ResponseEntity.ok(
                expenseService.createExpense(request)
        );
    }

    //Lista wydatków podróży
    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Expense>> getTripExpenses(
            @PathVariable UUID tripId
    ) {

        return ResponseEntity.ok(
                expenseService.getTripExpenses(tripId)
        );
    }

    //Ostatnie wydatki użytkownika
    @GetMapping("/recent/{userId}")
    public ResponseEntity<List<RecentExpenseDto>>
    getRecentExpenses(
            @PathVariable UUID userId
    ) {

        return ResponseEntity.ok(
                expenseService.getRecentExpensesForUser(
                        userId,
                        5
                )
        );
    }

    //Statystyki budżetowe użytkownika
    @GetMapping("/statistics/{userId}")
    public ResponseEntity<BudgetStatisticsDto>
    getStatistics(
            @PathVariable UUID userId
    ) {

        return ResponseEntity.ok(
                expenseService.getBudgetStatisticsForUser(
                        userId
                )
        );
    }
    @PutMapping("/{expenseId}")
        public Expense updateExpense(
        @PathVariable UUID expenseId,
        @RequestBody UpdateExpenseRequest request
        ) {
                return expenseService.updateExpense(
                expenseId,
                request
                );
        }

        @DeleteMapping("/{expenseId}")
        public void deleteExpense(
        @PathVariable UUID expenseId
        ) {
                expenseService.deleteExpense(expenseId);
        }

        @GetMapping("/settlements/{tripId}")
        public List<SettlementDto> getTripSettlements(
                @PathVariable UUID tripId
        ) {
                return expenseSettlementService.calculateTripSettlements(tripId);
        }
}