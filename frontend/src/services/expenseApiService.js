import { apiRequest } from "./apiConfig";
import { getCurrentUser } from "./authService";

const CATEGORY_IDS = {
  Transport: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  Jedzenie: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  Nocleg: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  Atrakcje: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  Zakupy: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  Inne: "aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
};

export function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
  );
}

function firstTextValue(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      (typeof item === "string" || typeof item === "number") &&
      String(item).trim() !== ""
  );

  return value !== undefined && value !== null ? String(value) : "";
}

function extractId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value !== "object") {
    return "";
  }

  return firstTextValue(
    value.id,
    value.userId,
    value.uuid,
    value.memberId,
    value.accountId,
    value.participantId,
    value.profileId,
    value.user?.id,
    value.user?.userId,
    value.user?.uuid,
    value.account?.id,
    value.account?.userId,
    value.account?.uuid,
    value.profile?.id,
    value.profile?.userId,
    value.profile?.uuid,
    value.member?.id,
    value.member?.userId,
    value.member?.uuid
  );
}

function getCategoryName(category) {
  if (!category) {
    return "Inne";
  }

  if (typeof category === "string") {
    return category;
  }

  return firstTextValue(
    category.name,
    category.nazwa,
    category.categoryName,
    "Inne"
  );
}

function getCategoryId(categoryName, explicitCategoryId) {
  const explicitId = extractId(explicitCategoryId);

  if (explicitId) {
    return explicitId;
  }

  return CATEGORY_IDS[categoryName] || CATEGORY_IDS.Inne;
}

export function getParticipantId(participant) {
  const participantId = extractId(participant);

  if (isValidUuid(participantId)) {
    return participantId;
  }

  return "";
}

export function getParticipantName(participant) {
  const currentUser = getCurrentUser();
  const participantId = getParticipantId(participant);

  if (
    currentUser?.id &&
    participantId &&
    String(currentUser.id) === String(participantId)
  ) {
    return currentUser.name || currentUser.email || "Ty";
  }

  if (!participant) {
    return "Uczestnik";
  }

  if (typeof participant === "string") {
    return isValidUuid(participant) ? participant : "Uczestnik";
  }

  return firstTextValue(
    participant.name,
    participant.fullName,
    participant.userName,
    participant.username,
    participant.displayName,
    participant.email,

    participant.user?.name,
    participant.user?.fullName,
    participant.user?.username,
    participant.user?.displayName,
    participant.user?.email,

    participant.account?.name,
    participant.account?.fullName,
    participant.account?.username,
    participant.account?.displayName,
    participant.account?.email,

    participant.profile?.name,
    participant.profile?.fullName,
    participant.profile?.username,
    participant.profile?.displayName,
    participant.profile?.email,

    participant.member?.name,
    participant.member?.fullName,
    participant.member?.username,
    participant.member?.displayName,
    participant.member?.email,

    "Uczestnik"
  );
}

export function findParticipantById(participants, participantId) {
  return participants.find(
    (participant) =>
      String(getParticipantId(participant)) === String(participantId)
  );
}

export function getParticipantNameById(participants, participantId) {
  const currentUser = getCurrentUser();

  if (
    currentUser?.id &&
    participantId &&
    String(currentUser.id) === String(participantId)
  ) {
    return currentUser.name || currentUser.email || "Ty";
  }

  const participant = findParticipantById(participants, participantId);

  if (participant) {
    return getParticipantName(participant);
  }

  return participantId || "Uczestnik";
}

function normalizeSplitItem(splitItem, participants = []) {
  const userId = extractId(
    firstValue(
      splitItem.userId,
      splitItem.idUzytkownika,
      splitItem.participantId,
      splitItem.user,
      splitItem.participant
    )
  );

  const shareAmount = Number(
    firstValue(splitItem.shareAmount, splitItem.amount, splitItem.kwotaUdzialu, 0)
  );

  const percent = Number(
    firstValue(
      splitItem.percentageShare,
      splitItem.percent,
      splitItem.procentUdzialu,
      0
    )
  );

  return {
    userId: isValidUuid(userId) ? userId : "",
    userName: getParticipantNameById(participants, userId),
    percent,
    amount: shareAmount,
    shareAmount,
  };
}

export function normalizeExpense(expense, participants = [], trip = null) {
  const categoryName = getCategoryName(expense.category);

  const payerId = extractId(
    firstValue(
      expense.payerId,
      expense.idPlacacego,
      expense.paidById,
      expense.payer,
      expense.paidBy
    )
  );

  const originalAmount = Number(
    firstValue(expense.originalAmount, expense.amount, expense.kwotaOryginalna, 0)
  );

  const convertedAmount = Number(
    firstValue(
      expense.convertedAmount,
      expense.amountInBaseCurrency,
      expense.kwotaPrzeliczona,
      expense.amount,
      0
    )
  );

  const shares = Array.isArray(expense.shares)
    ? expense.shares
    : Array.isArray(expense.split)
      ? expense.split
      : [];

  return {
    ...expense,
    id: extractId(firstValue(expense.id, expense.expenseId, expense.idWydatku)),
    tripId: extractId(firstValue(expense.tripId, expense.idPodrozy, trip?.id)),
    name: firstTextValue(
      expense.name,
      expense.title,
      expense.description,
      categoryName,
      "Wydatek"
    ),
    category: categoryName,
    categoryId: extractId(
      firstValue(expense.categoryId, expense.category?.id, expense.category?.categoryId)
    ),
    payerId: isValidUuid(payerId) ? payerId : "",
    paidById: isValidUuid(payerId) ? payerId : "",
    paidBy: firstTextValue(
      expense.paidBy,
      expense.payerName,
      getParticipantNameById(participants, payerId)
    ),
    originalAmount,
    amount: originalAmount,
    originalCurrency: firstTextValue(
      expense.originalCurrency,
      expense.currency,
      trip?.currency,
      "PLN"
    ),
    currency: firstTextValue(
      expense.currency,
      expense.originalCurrency,
      trip?.currency,
      "PLN"
    ),
    convertedAmount,
    baseCurrency: firstTextValue(
      expense.baseCurrency,
      trip?.currency,
      expense.currency,
      "PLN"
    ),
    expenseDate: firstTextValue(expense.expenseDate, expense.date, ""),
    date: firstTextValue(expense.expenseDate, expense.date, ""),
    description: firstTextValue(expense.description, ""),
    split: shares
      .map((share) => normalizeSplitItem(share, participants))
      .filter((share) => isValidUuid(share.userId)),
  };
}

function buildParticipantsForApi(splitRows, totalAmount) {
  const includedRows = splitRows.filter(
    (row) => isValidUuid(row.userId) && Number(row.shareAmount) > 0
  );

  let assignedAmount = 0;

  return includedRows.map((row, index) => {
    if (index === includedRows.length - 1) {
      const lastAmount = Number((Number(totalAmount) - assignedAmount).toFixed(2));

      return {
        userId: String(row.userId),
        shareAmount: lastAmount,
      };
    }

    const shareAmount = Number(row.shareAmount.toFixed(2));
    assignedAmount = Number((assignedAmount + shareAmount).toFixed(2));

    return {
      userId: String(row.userId),
      shareAmount,
    };
  });
}

function buildExpensePayload(expenseData, tripId) {
  const amount = Number(expenseData.originalAmount ?? expenseData.amount ?? 0);
  const categoryName = expenseData.category || "Inne";
  const safeTripId = extractId(tripId || expenseData.tripId);
  const safePayerId = extractId(
    expenseData.payerId || expenseData.paidById || expenseData.paidBy
  );

  if (!isValidUuid(safeTripId)) {
    throw new Error("Brak poprawnego ID podróży.");
  }

  if (!isValidUuid(safePayerId)) {
    throw new Error("Wybierz poprawnego uczestnika płacącego.");
  }

  const participants = buildParticipantsForApi(expenseData.split || [], amount);

  if (participants.length === 0) {
    throw new Error("Brak poprawnych uczestników w podziale kosztów.");
  }

  return {
    tripId: safeTripId,
    payerId: safePayerId,
    amount,
    currency: expenseData.originalCurrency || expenseData.currency || "PLN",
    categoryId: getCategoryId(categoryName, expenseData.categoryId),
    description: expenseData.description || expenseData.name || categoryName,
    expenseDate: expenseData.expenseDate,
    participants,
  };
}

export async function getTripExpenses(tripId, trip = null) {
  const expenses = await apiRequest(`/expenses/trip/${tripId}`, {
    method: "GET",
  });

  const participants = trip?.participants || [];

  return Array.isArray(expenses)
    ? expenses.map((expense) => normalizeExpense(expense, participants, trip))
    : [];
}

export async function getExpenseById(expenseId, trip = null) {
  const expense = await apiRequest(`/expenses/${expenseId}`, {
    method: "GET",
  });

  return normalizeExpense(expense, trip?.participants || [], trip);
}

export async function addExpense(tripId, expenseData, trip = null) {
  const createdExpense = await apiRequest("/expenses", {
    method: "POST",
    body: JSON.stringify(buildExpensePayload(expenseData, tripId)),
  });

  const createdExpenseId = extractId(
    firstValue(createdExpense?.id, createdExpense?.expenseId)
  );

  if (createdExpenseId) {
    try {
      return await getExpenseById(createdExpenseId, trip);
    } catch {
      return normalizeExpense(createdExpense, trip?.participants || [], trip);
    }
  }

  return normalizeExpense(createdExpense, trip?.participants || [], trip);
}

export async function updateExpense(expenseId, expenseData, trip = null) {
  const updatedExpense = await apiRequest(`/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(buildExpensePayload(expenseData, expenseData.tripId)),
  });

  return normalizeExpense(updatedExpense, trip?.participants || [], trip);
}

export async function deleteExpense(expenseId) {
  await apiRequest(`/expenses/${expenseId}`, {
    method: "DELETE",
  });
}

export async function getExpenseSettlements(tripId) {
  const settlements = await apiRequest(`/expenses/settlements/${tripId}`, {
    method: "GET",
  });

  return Array.isArray(settlements) ? settlements : [];
}