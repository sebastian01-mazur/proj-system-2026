import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import {
  getTripById,
  getTripExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../services/tripService";

const DEFAULT_CATEGORIES = [
  "Transport",
  "Jedzenie",
  "Nocleg",
  "Atrakcje",
  "Zakupy",
  "Inne",
];

const CURRENCIES = ["PLN", "EUR", "USD", "GBP", "CHF"];

export default function Expenses() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

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
      const tripData = await getTripById(id);
      const expensesData = await getTripExpenses(id);

      setTrip(tripData);
      setExpenses(expensesData);

      const participants = tripData?.participants || [];
      setPaidBy(participants[0] || "");
      setCurrency(tripData?.currency || "PLN");
      setSplitRows(createEqualSplitRows(participants));
    }

    loadData();
  }, [id]);

  function createEqualSplitRows(participants) {
    if (!participants || participants.length === 0) {
      return [];
    }

    const rows = participants.map((participant) => ({
      userName: participant,
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

  function resetForm() {
    setEditingExpenseId(null);
    setName("");
    setCategory(categories[0] || DEFAULT_CATEGORIES[0]);
    setPaidBy(trip?.participants?.[0] || "");
    setAmount("");
    setCurrency(trip?.currency || "PLN");
    setExpenseDate("");
    setDescription("");
    setSplitRows(createEqualSplitRows(trip?.participants || []));
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

  function handleSplitToggle(userName) {
    setSplitRows((previousRows) => {
      const updatedRows = previousRows.map((row) =>
        row.userName === userName
          ? { ...row, included: !row.included }
          : row
      );

      return recalculateEqualSplit(updatedRows);
    });
  }

  function handleSplitPercentChange(userName, value) {
    setSplitRows((previousRows) =>
      previousRows.map((row) =>
        row.userName === userName
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

  function buildSplitData(convertedAmount) {
    return splitRows
      .filter((row) => row.included)
      .map((row) => {
        const percent = Number(row.percent || 0);
        const splitAmount = Number(((convertedAmount * percent) / 100).toFixed(2));

        return {
          userName: row.userName,
          percent,
          amount: splitAmount,
        };
      });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const splitPercentSum = Number(getSplitPercentSum().toFixed(2));

    if (!name.trim()) {
      alert("Wpisz nazwę wydatku.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Wpisz poprawną kwotę.");
      return;
    }

    if (!expenseDate) {
      alert("Wybierz datę wydatku.");
      return;
    }

    if (!paidBy) {
      alert("Wybierz uczestnika płacącego.");
      return;
    }

    if (splitRows.filter((row) => row.included).length === 0) {
      alert("Wybierz uczestników do podziału kosztów.");
      return;
    }

    if (splitPercentSum !== 100) {
      alert("Suma procentów w podziale kosztów musi wynosić 100%.");
      return;
    }

    const originalAmount = Number(amount);
    const baseCurrency = trip.currency || "PLN";

    // Mock pod przyszłe API NBP: na razie kurs = 1.
    const exchangeRate = currency === baseCurrency ? 1 : 1;
    const convertedAmount = Number((originalAmount * exchangeRate).toFixed(2));

    const expenseData = {
      tripId: Number(id),
      name,
      category,
      paidBy,
      originalAmount,
      originalCurrency: currency,
      convertedAmount,
      baseCurrency,
      expenseDate,
      description,
      exchangeRate,
      split: buildSplitData(convertedAmount),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (editingExpenseId) {
      const updatedExpense = await updateExpense(editingExpenseId, expenseData);

      setExpenses((previousExpenses) =>
        previousExpenses.map((expense) =>
          Number(expense.id) === Number(editingExpenseId)
            ? updatedExpense
            : expense
        )
      );
    } else {
      const newExpense = await addExpense(id, expenseData);
      setExpenses((previousExpenses) => [...previousExpenses, newExpense]);
    }

    resetForm();
  }

  function handleEdit(expense) {
    setEditingExpenseId(expense.id);
    setName(expense.name || "");
    setCategory(expense.category || categories[0]);
    setPaidBy(expense.paidBy || trip.participants?.[0] || "");
    setAmount(expense.originalAmount || "");
    setCurrency(expense.originalCurrency || trip.currency || "PLN");
    setExpenseDate(expense.expenseDate || "");
    setDescription(expense.description || "");

    const participants = trip.participants || [];

    setSplitRows(
      participants.map((participant) => {
        const splitItem = expense.split?.find(
          (item) => item.userName === participant
        );

        return {
          userName: participant,
          included: Boolean(splitItem),
          percent: splitItem?.percent || 0,
        };
      })
    );
  }

  async function handleDelete(expenseId) {
    await deleteExpense(expenseId);

    setExpenses((previousExpenses) =>
      previousExpenses.filter(
        (expense) => Number(expense.id) !== Number(expenseId)
      )
    );

    if (Number(editingExpenseId) === Number(expenseId)) {
      resetForm();
    }
  }

  if (!trip) {
    return (
      <Layout>
        <main className="content">
          <p>Ładowanie wydatków...</p>
        </main>
      </Layout>
    );
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.convertedAmount || 0),
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
                {trip.participants?.map((participant) => (
                  <option key={participant} value={participant}>
                    {participant}
                  </option>
                ))}
              </select>

              <label>Kwota w walucie podróży</label>
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
                    <div className="split-row" key={row.userName}>
                      <label className="split-check">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() => handleSplitToggle(row.userName)}
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
                              row.userName,
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
                {totalExpenses.toFixed(2)} {trip.currency || "PLN"}
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

                      <span>Zapłacił/a: {expense.paidBy}</span>

                      <span>
                        Podział: {" "}
                        {expense.split
                          ?.map((item) => `${item.userName} ${item.percent}%`)
                          .join(", ")}
                      </span>
                    </div>

                    <div className="expense-item-side">
                      <strong>
                        {Number(expense.originalAmount || 0).toFixed(2)} {" "}
                        {expense.originalCurrency}
                      </strong>

                      <span>
                        ≈ {Number(expense.convertedAmount || 0).toFixed(2)} {" "}
                        {expense.baseCurrency}
                      </span>

                      <div className="expense-actions">
                        <button type="button" onClick={() => handleEdit(expense)}>
                          Edytuj
                        </button>

                        <button type="button" onClick={() => handleDelete(expense.id)}>
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
