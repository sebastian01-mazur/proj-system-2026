package com.splittrip.expense.validation;

import com.splittrip.expense.dto.CreateExpenseRequest;
import com.splittrip.expense.dto.ExpenseParticipantDto;
import com.splittrip.trip.MemberService;
import com.splittrip.trip.Trip;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

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
        validateParticipants(
                request.participants(),
                request.amount(),
                request.payerId()
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
    private void validateParticipants(
        List<ExpenseParticipantDto> participants,
        BigDecimal totalAmount,
        UUID payerId
) {

    if (participants == null || participants.isEmpty()) {

        throw new RuntimeException(
                "Lista uczestników podziału nie może być pusta"
        );
    }

    Set<UUID> uniqueUsers =
            new HashSet<>();

    BigDecimal totalShares =
            BigDecimal.ZERO;

    boolean payerIncluded =
            false;

    for (ExpenseParticipantDto participant : participants) {

        if (participant.shareAmount() == null
                || participant.shareAmount()
                .compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Kwota udziału musi być większa od 0"
            );
        }

        if (!uniqueUsers.add(participant.userId())) {

            throw new RuntimeException(
                    "Użytkownik nie może występować wielokrotnie w podziale kosztów"
            );
        }

        if (participant.userId().equals(payerId)) {

            payerIncluded = true;
        }

        totalShares =
                totalShares.add(
                        participant.shareAmount()
                );
    }

    if (!payerIncluded) {

        throw new RuntimeException(
                "Płatnik musi być uczestnikiem podziału kosztów"
        );
    }

    if (totalShares.compareTo(totalAmount) != 0) {

        throw new RuntimeException(
                "Suma udziałów musi być równa całkowitej kwocie wydatku"
        );
    }
}
}