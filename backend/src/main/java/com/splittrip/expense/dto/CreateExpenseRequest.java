package com.splittrip.expense.dto;

import com.splittrip.expense.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateExpenseRequest(
    UUID tripId,
    UUID payerId,
    BigDecimal amount,
    String currency,
    ExpenseCategory category,
    String description,
    LocalDate expenseDate
) {
}
