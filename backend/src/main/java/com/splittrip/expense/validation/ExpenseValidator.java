package com.splittrip.expense.validation;

import com.splittrip.expense.dto.CreateExpenseRequest;
import com.splittrip.trip.MemberService;
import com.splittrip.trip.Trip;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ExpenseValidator {

    private final MemberService memberService;

    public ExpenseValidator(MemberService memberService) {
        this.memberService = memberService;
    }

    public void validateCreateExpense(
            CreateExpenseRequest request,
            Trip trip
    ) {

        validateAmount(request.amount());

        validateExpenseDate(
                request.expenseDate(),
                trip
        );

        validatePayerMembership(
                request.payerId(),
                trip.getId()
        );
    }

    private void validateAmount(BigDecimal amount) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Kwota wydatku musi być większa od 0"
            );
        }
    }

    private void validateExpenseDate(
            java.time.LocalDate expenseDate,
            Trip trip
    ) {

        if (expenseDate.isBefore(trip.getStartDate())
                || expenseDate.isAfter(trip.getEndDate())) {

            throw new RuntimeException(
                    "Data wydatku musi mieścić się w zakresie podróży"
            );
        }
    }

    private void validatePayerMembership(
            java.util.UUID payerId,
            java.util.UUID tripId
    ) {

        boolean isMember =
                memberService
                        .getUserTripIds(payerId)
                        .contains(tripId);

        if (!isMember) {

            throw new RuntimeException(
                    "Płatnik nie należy do tej podróży"
            );
        }
    }
}