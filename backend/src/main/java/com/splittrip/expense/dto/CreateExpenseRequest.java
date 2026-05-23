package com.splittrip.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

public record CreateExpenseRequest(
    UUID tripId,
    UUID payerId,
    BigDecimal amount,
    String currency,
    UUID categoryId,
    String description,
    LocalDate expenseDate,
    List<ExpenseParticipantDto> participants
) {
}
