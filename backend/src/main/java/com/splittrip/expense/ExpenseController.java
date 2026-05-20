package com.splittrip.expense;

import com.splittrip.expense.dto.BudgetStatisticsDto;
import com.splittrip.expense.dto.CreateExpenseRequest;
import com.splittrip.expense.dto.RecentExpenseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    //Obsługuje operacje CRUD na wydatkach: dodawanie nowych kosztów, ich edycję, usuwanie oraz wyświetlanie listy

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
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
}