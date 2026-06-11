import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { getTripById } from "../services/tripApiService";
import { getCurrentUser } from "../services/authService";
import {
  addExpense,
  deleteExpense,
  getParticipantId,
  getParticipantName,
  getTripExpenses,
  isValidUuid,
  updateExpense,
} from "../services/expenseApiService";

const DEFAULT_CATEGORIES = [
  "Transport",
  "Jedzenie",
  "Nocleg",
  "Atrakcje",
  "Zakupy",
  "Inne",
];

const CURRENCIES = ["PLN", "EUR", "USD", "GBP", "CHF"];

function withTimeout(promise, message, timeout = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeout)
    ),
  ]);
}

export default function Expenses() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [paidBy, setPaidBy] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");
  const [splitRows, setSplitRows] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const tripData = await withTimeout(
          getTripById(id),
          "API nie odpowiedziało przy pobieraniu podróży. Sprawdź endpoint /trips/{id}."
        );

        const expensesData = await withTimeout(
          getTripExpenses(id, tripData),
          "API nie odpowiedziało przy pobieraniu wydatków. Sprawdź endpoint /expenses/trip/{tripId}."
        );

        const participants = tripData?.participants || [];
        const validParticipants = getValidParticipants(participants);

        setTrip(tripData);
        setExpenses(expensesData);
        setPaidBy(validParticipants[0]?.userId || "");
        setCurrency(tripData?.currency || tripData?.baseCurrency || "PLN");
        setSplitRows(createEqualSplitRows(participants));
      } catch (error) {
        console.error("Błąd ładowania wydatków:", error);
        setError(error.message || "Nie udało się pobrać wydatków.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

function getValidParticipants(participants) {
  const currentUser = getCurrentUser();

  const validParticipants = (participants || [])
    .map((participant) => ({
      userId: getParticipantId(participant),
      userName: getParticipantName(participant),
    }))
    .filter((participant) => isValidUuid(participant.userId));

  if (
    currentUser?.id &&
    isValidUuid(currentUser.id) &&
    !validParticipants.some(
      (participant) => String(participant.userId) === String(currentUser.id)
    )
  ) {
    validParticipants.push({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email || "Ty",
    });
  }

  return validParticipants;
}

  function createEqualSplitRows(participants) {
    const validParticipants = getValidParticipants(participants);

    if (validParticipants.length === 0) {
      return [];
    }

    const rows = validParticipants.map((participant) => ({
      userId: participant.userId,
      userName: participant.userName,
      included: true,
      percent: 0,
    }));

    return recalculateEqualSplit(rows);
  }

  function recalculateEqualSplit(rows) {
    const includedRows = rows.filter((row) => row.included);

    if (includedRows.length === 0) {
      return rows.map((row) => ({ ...row, percent: 0 }));
    }

    const basePercent = Number((100 / includedRows.length).toFixed(2));
    let assignedPercent = 0;
    let includedIndex = 0;

    return rows.map((row) => {
      if (!row.included) {
        return { ...row, percent: 0 };
      }

      includedIndex += 1;

      if (includedIndex === includedRows.length) {
        return {
          ...row,
          percent: Number((100 - assignedPercent).toFixed(2)),
        };
      }

      assignedPercent += basePercent;

      return { ...row, percent: basePercent };
    });
  }

  function getParticipantNameById(userId) {
    const participant = trip?.participants?.find(
      (item) => String(getParticipantId(item)) === String(userId)
    );

    return getParticipantName(participant) || "Uczestnik";
  }

  function resetForm() {
    const participants = trip?.participants || [];
    const validParticipants = getValidParticipants(participants);

    setEditingExpenseId(null);
    setName("");
    setCategory(categories[0] || DEFAULT_CATEGORIES[0]);
    setPaidBy(validParticipants[0]?.userId || "");
    setAmount("");
    setCurrency(trip?.currency || trip?.baseCurrency || "PLN");
    setExpenseDate("");
    setDescription("");
    setSplitRows(createEqualSplitRows(participants));
  }

  function handleAddCategory() {
    const trimmedCategory = newCategory.trim();

    if (!trimmedCategory) {
      return;
    }

    if (!categories.includes(trimmedCategory)) {
      setCategories((previousCategories) => [
        ...previousCategories,
        trimmedCategory,
      ]);
    }

    setCategory(trimmedCategory);
    setNewCategory("");
    setShowCategoryInput(false);
  }

  function handleSplitToggle(userId) {
    setSplitRows((previousRows) => {
      const updatedRows = previousRows.map((row) =>
        row.userId === userId ? { ...row, included: !row.included } : row
      );

      return recalculateEqualSplit(updatedRows);
    });
  }

  function handleSplitPercentChange(userId, value) {
    setSplitRows((previousRows) =>
      previousRows.map((row) =>
        row.userId === userId
          ? {
              ...row,
              included: Number(value) > 0,
              percent: Number(value),
            }
          : row
      )
    );
  }

function getSplitPercentSum() {
  return splitRows.reduce(
    (sum, row) => sum + (row.included ? Number(row.percent || 0) : 0),
    0
  );
}

  function buildSplitData(totalAmount) {
    const includedRows = splitRows.filter(
      (row) => row.included && isValidUuid(row.userId)
    );

    let assignedAmount = 0;

    return includedRows.map((row, index) => {
      const percent = Number(row.percent || 0);

      if (index === includedRows.length - 1) {
        const lastAmount = Number(
          (Number(totalAmount) - assignedAmount).toFixed(2)
        );

        return {
          userId: row.userId,
          userName: row.userName,
          percent,
          amount: lastAmount,
          shareAmount: lastAmount,
        };
      }

      const splitAmount = Number(
        ((Number(totalAmount) * percent) / 100).toFixed(2)
      );

      assignedAmount = Number((assignedAmount + splitAmount).toFixed(2));

      return {
        userId: row.userId,
        userName: row.userName,
        percent,
        amount: splitAmount,
        shareAmount: splitAmount,
      };
    });
  }

  async function refreshExpenses() {
    const refreshedExpenses = await withTimeout(
      getTripExpenses(id, trip),
      "API nie odpowiedziało przy odświeżaniu listy wydatków."
    );

    setExpenses(refreshedExpenses);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const splitPercentSum = Number(getSplitPercentSum().toFixed(2));
    const originalAmount = Number(amount);
    const validIncludedRows = splitRows.filter(
      (row) => row.included && isValidUuid(row.userId)
    );

    if (!name.trim()) {
      alert("Wpisz nazwę wydatku.");
      return;
    }

    if (!amount || originalAmount <= 0) {
      alert("Wpisz poprawną kwotę.");
      return;
    }

    if (!expenseDate) {
      alert("Wybierz datę wydatku.");
      return;
    }

    if (!paidBy || !isValidUuid(paidBy)) {
      alert("Wybierz poprawnego uczestnika płacącego.");
      return;
    }

    if (validIncludedRows.length === 0) {
      alert("Wybierz poprawnych uczestników do podziału kosztów.");
      return;
    }

    if (splitPercentSum !== 100) {
      alert("Suma procentów w podziale kosztów musi wynosić 100%.");
      return;
    }

    const baseCurrency = trip.currency || trip.baseCurrency || "PLN";

    const expenseData = {
      tripId: id,
      name,
      category,
      payerId: paidBy,
      paidBy,
      originalAmount,
      amount: originalAmount,
      originalCurrency: currency,
      currency,
      baseCurrency,
      expenseDate,
      description,
      split: buildSplitData(originalAmount),
    };

    try {
      if (editingExpenseId) {
        await withTimeout(
          updateExpense(editingExpenseId, expenseData, trip),
          "API nie odpowiedziało przy edycji wydatku."
        );
      } else {
        await withTimeout(
          addExpense(id, expenseData, trip),
          "API nie odpowiedziało przy dodawaniu wydatku."
        );
      }

      await refreshExpenses();
      resetForm();
    } catch (error) {
      console.error("Błąd zapisu wydatku:", error);
      alert(`Nie udało się zapisać wydatku: ${error.message}`);
    }
  }

  function handleEdit(expense) {
    setEditingExpenseId(expense.id);
    setName(expense.name || expense.description || "");
    setCategory(expense.category || categories[0]);
    setPaidBy(expense.payerId || expense.paidById || "");
    setAmount(expense.originalAmount || expense.amount || "");
    setCurrency(expense.originalCurrency || expense.currency || trip.currency || "PLN");
    setExpenseDate(expense.expenseDate || "");
    setDescription(expense.description || "");

    const participants = trip.participants || [];
    const validParticipants = getValidParticipants(participants);

    setSplitRows(
      validParticipants.map((participant) => {
        const splitItem = expense.split?.find(
          (item) => String(item.userId) === String(participant.userId)
        );

        return {
          userId: participant.userId,
          userName: participant.userName,
          included: Boolean(splitItem),
          percent: splitItem?.percent || 0,
        };
      })
    );
  }

  async function handleDelete(expenseId) {
    const confirmed = window.confirm("Na pewno usunąć ten wydatek?");

    if (!confirmed) {
      return;
    }

    try {
      await withTimeout(
        deleteExpense(expenseId),
        "API nie odpowiedziało przy usuwaniu wydatku."
      );

      setExpenses((previousExpenses) =>
        previousExpenses.filter(
          (expense) => String(expense.id) !== String(expenseId)
        )
      );

      if (String(editingExpenseId) === String(expenseId)) {
        resetForm();
      }
    } catch (error) {
      console.error("Błąd usuwania wydatku:", error);
      alert(`Nie udało się usunąć wydatku: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <Layout>
        <main className="content">
          <p>Ładowanie wydatków...</p>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <main className="content">
          <Link to={`/trip/${id}`} className="back-btn">
            ← Wróć
          </Link>

          <Card>
            <h3>Nie udało się pobrać wydatków</h3>
            <p>{error}</p>
            <p>
              To znaczy, że frontend działa, ale request do API wydatków albo
              podróży nie wrócił poprawnie.
            </p>
          </Card>
        </main>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <main className="content">
          <Link to="/home" className="back-btn">
            ← Wróć
          </Link>

          <Card>
            <h3>Nie znaleziono podróży</h3>
            <p>Nie udało się pobrać danych tej podróży.</p>
          </Card>
        </main>
      </Layout>
    );
  }

  const validParticipants = getValidParticipants(trip.participants || []);

  const totalExpenses = expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.convertedAmount || expense.amount || 0),
    0
  );

  const splitPercentSum = Number(getSplitPercentSum().toFixed(2));

  return (
    <Layout>
      <main className="content expenses-page">
        <Link to={`/trip/${id}`} className="back-btn">
          ← Wróć
        </Link>

        <PageTitle
          title={editingExpenseId ? "Edytuj wydatek" : "Dodaj nowy wydatek"}
          subtitle="Miej swoje wyjazdowe finanse pod kontrolą!"
        />

        <section className="expenses-layout">
          <Card className="expense-form-card">
            <form className="expense-form" onSubmit={handleSubmit}>
              <label>Nazwa wydatku</label>
              <input
                placeholder="Metro"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <label>Wybierz podróż</label>
              <select value={trip.id} disabled>
                <option value={trip.id}>{trip.name}</option>
              </select>

              <label>Kategoria wydatku</label>
              <div className="category-row">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((categoryItem) => (
                    <option key={categoryItem} value={categoryItem}>
                      {categoryItem}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="category-add-btn"
                  onClick={() =>
                    setShowCategoryInput((previousValue) => !previousValue)
                  }
                >
                  +
                </button>
              </div>

              {showCategoryInput && (
                <div className="new-category-row">
                  <input
                    placeholder="Nowa kategoria"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  />

                  <button type="button" onClick={handleAddCategory}>
                    Dodaj
                  </button>
                </div>
              )}

              <label>Wybierz uczestnika płacącego</label>
              <select
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
              >
                {validParticipants.map((participant) => (
                  <option key={participant.userId} value={participant.userId}>
                    {participant.userName}
                  </option>
                ))}
              </select>

              <label>Kwota wydatku</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="25"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />

              <label>Waluta wydatku</label>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((currencyItem) => (
                  <option key={currencyItem} value={currencyItem}>
                    {currencyItem}
                  </option>
                ))}
              </select>

              <label>Data wydatku</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
              />

              <label>Opis</label>
              <textarea
                rows="5"
                placeholder="Bilety w obydwie strony"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />

              <div className="split-box">
                <h3>Podział kosztów</h3>
                <p>Wybierz uczestników i ustaw procentowy udział w koszcie.</p>

                <div className="split-list">
                  {splitRows.map((row) => (
                    <div className="split-row" key={row.userId}>
                      <label className="split-check">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() => handleSplitToggle(row.userId)}
                        />

                        <span>{row.userName}</span>
                      </label>

                      <div className="split-percent">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={row.percent}
                          disabled={!row.included}
                          onChange={(event) =>
                            handleSplitPercentChange(
                              row.userId,
                              event.target.value
                            )
                          }
                        />

                        <span>%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className={
                    splitPercentSum === 100
                      ? "split-summary"
                      : "split-summary split-summary-error"
                  }
                >
                  Suma udziałów: {splitPercentSum}%
                </div>
              </div>

              <Button type="submit">
                {editingExpenseId ? "Zapisz zmiany" : "Dodaj"}
              </Button>

              {editingExpenseId && (
                <button
                  type="button"
                  className="cancel-edit-btn"
                  onClick={resetForm}
                >
                  Anuluj edycję
                </button>
              )}
            </form>
          </Card>

          <Card className="expenses-list-card">
            <h3>Lista wydatków</h3>

            <div className="expenses-total">
              <span>Łącznie:</span>
              <strong>
                {totalExpenses.toFixed(2)}{" "}
                {trip.currency || trip.baseCurrency || "PLN"}
              </strong>
            </div>

            {expenses.length === 0 ? (
              <p>Nie dodano jeszcze żadnych wydatków.</p>
            ) : (
              <ul className="expenses-list">
                {expenses.map((expense) => (
                  <li key={expense.id} className="expense-item">
                    <div className="expense-item-main">
                      <strong>{expense.name}</strong>

                      <span>
                        {expense.category} • {expense.expenseDate}
                      </span>

                      <span>
                        Zapłacił/a:{" "}
                        {expense.paidBy ||
                          getParticipantNameById(expense.payerId)}
                      </span>

                      <span>
                        Podział:{" "}
                        {expense.split?.length > 0
                          ? expense.split
                              .map(
                                (item) => `${item.userName} ${item.percent}%`
                              )
                              .join(", ")
                          : "Brak danych"}
                      </span>
                    </div>

                    <div className="expense-item-side">
                      <strong>
                        {Number(expense.originalAmount || 0).toFixed(2)}{" "}
                        {expense.originalCurrency || expense.currency}
                      </strong>

                      <span>
                        ≈ {Number(expense.convertedAmount || 0).toFixed(2)}{" "}
                        {expense.baseCurrency || trip.currency || "PLN"}
                      </span>

                      <div className="expense-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                        >
                          Edytuj
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </main>
    </Layout>
  );
}