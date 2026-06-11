import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/Layout";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

import { getTripById } from "../services/tripApiService";
import {
  getParticipantId,
  getParticipantName,
  getTripExpenses,
} from "../services/expenseApiService";
import {
  getExpenseReport,
  getParticipantReport,
  getReportSettlements,
} from "../services/reportApiService";

export default function Reports() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseReport, setExpenseReport] = useState(null);
  const [participantReport, setParticipantReport] = useState([]);
  const [apiSettlements, setApiSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      try {
        const tripData = await getTripById(id);
        const expensesData = await getTripExpenses(id, tripData);

        setTrip(tripData);
        setExpenses(expensesData);

        try {
          const reportData = await getExpenseReport(id);
          setExpenseReport(reportData);
        } catch (error) {
          console.warn("Nie udało się pobrać raportu wydatków z API:", error);
        }

        try {
          const participantData = await getParticipantReport(id);
          setParticipantReport(participantData);
        } catch (error) {
          console.warn("Nie udało się pobrać raportu uczestników z API:", error);
        }

        try {
          const settlementsData = await getReportSettlements(id);
          setApiSettlements(settlementsData);
        } catch (error) {
          console.warn("Nie udało się pobrać rozliczeń z API:", error);
        }
      } catch (error) {
        console.error(error);
        alert(`Nie udało się pobrać raportów: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [id]);

  function formatMoney(amount) {
    return Number(amount || 0).toFixed(2);
  }

  function getExpenseName(expense) {
    return expense.name || expense.description || expense.category || "Wydatek";
  }

  function getExpenseOriginalAmount(expense) {
    return Number(expense.originalAmount ?? expense.amount ?? 0);
  }

  function getExpenseOriginalCurrency(expense) {
    return expense.originalCurrency || expense.currency || "PLN";
  }

  function getExpenseConvertedAmount(expense) {
    return Number(expense.convertedAmount ?? expense.amount ?? 0);
  }

  function getExpenseBaseCurrency(expense) {
    return expense.baseCurrency || trip?.currency || trip?.baseCurrency || "PLN";
  }

  function getExpenseDate(expense) {
    return expense.expenseDate || expense.date || "";
  }

  function getParticipantNameById(userId) {
    const participant = trip?.participants?.find(
      (item) => String(getParticipantId(item)) === String(userId)
    );

    return getParticipantName(participant) || userId || "Uczestnik";
  }

  function calculateParticipantStatsFromExpenses() {
    const participants = trip?.participants || [];

    const stats = participants.reduce((result, participant) => {
      const userId = getParticipantId(participant);

      result[userId] = {
        id: userId,
        name: getParticipantName(participant),
        paid: 0,
        assigned: 0,
        balance: 0,
      };

      return result;
    }, {});

    expenses.forEach((expense) => {
      const payerId = expense.payerId || expense.paidById;
      const convertedAmount = getExpenseConvertedAmount(expense);

      if (!stats[payerId]) {
        stats[payerId] = {
          id: payerId,
          name: getParticipantNameById(payerId),
          paid: 0,
          assigned: 0,
          balance: 0,
        };
      }

      stats[payerId].paid += convertedAmount;

      if (expense.split?.length > 0) {
        expense.split.forEach((splitItem) => {
          const userId = splitItem.userId;
          const assignedAmount = Number(splitItem.amount || splitItem.shareAmount || 0);

          if (!stats[userId]) {
            stats[userId] = {
              id: userId,
              name: getParticipantNameById(userId),
              paid: 0,
              assigned: 0,
              balance: 0,
            };
          }

          stats[userId].assigned += assignedAmount;
        });
      }
    });

    return Object.values(stats).map((participant) => ({
      ...participant,
      balance: participant.paid - participant.assigned,
    }));
  }

  function getParticipantStats() {
    if (participantReport.length > 0) {
      return participantReport.map((participant) => {
        const participantId = participant.participantId || participant.userId || participant.id;
        const paid = Number(participant.amountPaid || 0);
        const assigned = Number(participant.amountAssigned || 0);
        const balance = Number(participant.balance || paid - assigned);

        return {
          id: participantId,
          name: getParticipantNameById(participantId),
          paid,
          assigned,
          balance,
        };
      });
    }

    return calculateParticipantStatsFromExpenses();
  }

  function calculateSettlements(participantStats) {
    const debtors = participantStats
      .filter((participant) => participant.balance < -0.01)
      .map((participant) => ({
        name: participant.name,
        amount: Math.abs(participant.balance),
      }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = participantStats
      .filter((participant) => participant.balance > 0.01)
      .map((participant) => ({
        name: participant.name,
        amount: participant.balance,
      }))
      .sort((a, b) => b.amount - a.amount);

    const settlements = [];

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Number(amount.toFixed(2)),
        });
      }

      debtor.amount = Number((debtor.amount - amount).toFixed(2));
      creditor.amount = Number((creditor.amount - amount).toFixed(2));

      if (debtor.amount <= 0.01) {
        debtorIndex += 1;
      }

      if (creditor.amount <= 0.01) {
        creditorIndex += 1;
      }
    }

    return settlements;
  }

  function getSettlements(participantStats) {
    if (apiSettlements.length > 0) {
      return apiSettlements.map((settlement) => {
        const fromId = settlement.debtorId || settlement.fromId || settlement.from;
        const toId = settlement.creditorId || settlement.toId || settlement.to;

        return {
          from: getParticipantNameById(fromId),
          to: getParticipantNameById(toId),
          amount: Number(settlement.amount || settlement.settledAmount || 0),
        };
      });
    }

    return calculateSettlements(participantStats);
  }

  if (loading) {
    return (
      <Layout>
        <main className="content">
          <p>Ładowanie raportu...</p>
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
            <p>Nie udało się wygenerować raportu dla tej podróży.</p>
          </Card>
        </main>
      </Layout>
    );
  }

  const currency = trip.currency || trip.baseCurrency || "PLN";
  const budget = Number(expenseReport?.totalBudget ?? trip.budget ?? trip.plannedBudget ?? 0);

  const totalExpenses = Number(
    expenseReport?.totalSpent ??
      expenses.reduce((sum, expense) => sum + getExpenseConvertedAmount(expense), 0)
  );

  const remainingBudget = budget - totalExpenses;

  const budgetUsage =
    expenseReport?.budgetUtilizationPercentage !== undefined
      ? Math.round(Number(expenseReport.budgetUtilizationPercentage))
      : budget > 0
        ? Math.round((totalExpenses / budget) * 100)
        : 0;

  const safeBudgetUsage = Math.min(budgetUsage, 100);

  const expensesByCategoryFromApi = expenseReport?.spentByCategory || null;

  const categoryData = expensesByCategoryFromApi
    ? Object.entries(expensesByCategoryFromApi)
        .map(([category, amount]) => ({
          category,
          amount: Number(amount || 0),
          count: expenses.filter((expense) => expense.category === category).length,
        }))
        .sort((a, b) => b.amount - a.amount)
    : Object.values(
        expenses.reduce((result, expense) => {
          const category = expense.category || "Inne";
          const amount = getExpenseConvertedAmount(expense);

          if (!result[category]) {
            result[category] = {
              category,
              amount: 0,
              count: 0,
            };
          }

          result[category].amount += amount;
          result[category].count += 1;

          return result;
        }, {})
      ).sort((a, b) => b.amount - a.amount);

  const biggestCategoryAmount = Math.max(
    ...categoryData.map((item) => item.amount),
    1
  );

  const biggestExpense =
    expenses.length > 0
      ? expenses.reduce((biggest, current) =>
          getExpenseConvertedAmount(current) > getExpenseConvertedAmount(biggest)
            ? current
            : biggest
        )
      : null;

  const averageExpense =
    expenses.length > 0 ? totalExpenses / expenses.length : 0;

  const participantStats = getParticipantStats();
  const settlements = getSettlements(participantStats);

  const mostExpensiveCategory = categoryData[0];

  const expensesSorted = [...expenses].sort(
    (a, b) => new Date(getExpenseDate(b)) - new Date(getExpenseDate(a))
  );

  return (
    <Layout>
      <main className="content reports-page">
        <Link to={`/trip/${id}`} className="back-btn">
          ← Wróć
        </Link>

        <PageTitle
          title="Raporty i statystyki"
          subtitle={`Podsumowanie podróży: ${trip.name}`}
        />

        {expenses.length === 0 && !expenseReport ? (
          <Card>
            <h3>Brak wydatków</h3>
            <p>
              Nie ma jeszcze danych do raportu. Dodaj pierwszy wydatek, aby
              zobaczyć statystyki podróży.
            </p>
          </Card>
        ) : (
          <section className="reports-grid">
            <Card className="report-card report-wide-card">
              <div className="report-card-header">
                <div>
                  <h3>Wykres wydatków</h3>
                  <p>Podział rzeczywistych wydatków według kategorii</p>
                </div>

                <strong>
                  {formatMoney(totalExpenses)} {currency}
                </strong>
              </div>

              <div className="category-chart">
                {categoryData.map((item, index) => {
                  const percentOfTotal =
                    totalExpenses > 0
                      ? Math.round((item.amount / totalExpenses) * 100)
                      : 0;

                  const barWidth = Math.round(
                    (item.amount / biggestCategoryAmount) * 100
                  );

                  return (
                    <div className="category-chart-row" key={item.category}>
                      <div className="category-chart-top">
                        <div>
                          <span
                            className={`report-dot report-dot-${index + 1}`}
                          />
                          <strong>{item.category}</strong>
                        </div>

                        <span>
                          {formatMoney(item.amount)} {currency} /{" "}
                          {percentOfTotal}%
                        </span>
                      </div>

                      <div className="category-chart-bar">
                        <div
                          className={`category-chart-fill report-fill-${
                            index + 1
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="report-card">
              <h3>Budżet vs wydatki</h3>

              <div className="budget-report-summary">
                <div>
                  <span>Budżet</span>
                  <strong>
                    {formatMoney(budget)} {currency}
                  </strong>
                </div>

                <div>
                  <span>Wydano</span>
                  <strong>
                    {formatMoney(totalExpenses)} {currency}
                  </strong>
                </div>

                <div>
                  <span>Pozostało</span>
                  <strong
                    className={remainingBudget >= 0 ? "positive" : "negative"}
                  >
                    {formatMoney(remainingBudget)} {currency}
                  </strong>
                </div>
              </div>

              <div className="budget-report-bar">
                <div
                  className={
                    budgetUsage <= 100
                      ? "budget-report-fill"
                      : "budget-report-fill budget-report-fill-over"
                  }
                  style={{ width: `${safeBudgetUsage}%` }}
                />
              </div>

              <p className="report-note">
                Wykorzystanie budżetu: <strong>{budgetUsage}%</strong>
              </p>
            </Card>

            <Card className="report-card">
              <h3>Saldo uczestników</h3>

              <p className="report-note">
                Saldo pokazuje różnicę między tym, ile uczestnik zapłacił, a
                ile kosztów zostało mu przypisane.
              </p>

              <ul className="participant-balance-list">
                {participantStats.map((participant) => (
                  <li key={participant.id || participant.name}>
                    <div>
                      <strong>{participant.name}</strong>
                      <span>
                        Zapłacił: {formatMoney(participant.paid)} {currency}
                      </span>
                      <span>
                        Udział w kosztach: {formatMoney(participant.assigned)}{" "}
                        {currency}
                      </span>
                    </div>

                    <strong
                      className={
                        participant.balance >= 0 ? "positive" : "negative"
                      }
                    >
                      {participant.balance >= 0 ? "+" : ""}
                      {formatMoney(participant.balance)} {currency}
                    </strong>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="report-card">
              <h3>Bilans rozliczeń</h3>

              {settlements.length === 0 ? (
                <p>
                  Rozliczenia są wyrównane. Nikt nikomu nie musi zwracać
                  pieniędzy.
                </p>
              ) : (
                <ul className="settlement-list">
                  {settlements.map((settlement, index) => (
                    <li key={`${settlement.from}-${settlement.to}-${index}`}>
                      <span>
                        <strong>{settlement.from}</strong> zwraca{" "}
                        <strong>{settlement.to}</strong>
                      </span>

                      <strong>
                        {formatMoney(settlement.amount)} {currency}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="report-card">
              <h3>Statystyki podróży</h3>

              <div className="report-stats-grid">
                <div>
                  <span>Liczba wydatków</span>
                  <strong>{expenses.length}</strong>
                </div>

                <div>
                  <span>Liczba kategorii</span>
                  <strong>{categoryData.length}</strong>
                </div>

                <div>
                  <span>Średni wydatek</span>
                  <strong>
                    {formatMoney(averageExpense)} {currency}
                  </strong>
                </div>

                <div>
                  <span>Największy wydatek</span>
                  <strong>
                    {biggestExpense
                      ? `${getExpenseName(biggestExpense)} — ${formatMoney(
                          getExpenseConvertedAmount(biggestExpense)
                        )} ${currency}`
                      : "Brak"}
                  </strong>
                </div>

                <div>
                  <span>Najdroższa kategoria</span>
                  <strong>
                    {mostExpensiveCategory
                      ? `${mostExpensiveCategory.category} — ${formatMoney(
                          mostExpensiveCategory.amount
                        )} ${currency}`
                      : "Brak"}
                  </strong>
                </div>

                <div>
                  <span>Wykorzystanie budżetu</span>
                  <strong>{budgetUsage}%</strong>
                </div>
              </div>
            </Card>

            <Card className="report-card report-wide-card">
              <h3>Lista wydatków w raporcie</h3>

              <div className="report-expenses-list">
                {expensesSorted.map((expense) => (
                  <div className="report-expense-row" key={expense.id}>
                    <div>
                      <strong>{getExpenseName(expense)}</strong>
                      <span>
                        {expense.category} • {getExpenseDate(expense)}
                      </span>
                      <span>Zapłacił/a: {expense.paidBy}</span>
                      <span>
                        Podział:{" "}
                        {expense.split?.length > 0
                          ? expense.split
                              .map(
                                (item) =>
                                  `${item.userName}: ${formatMoney(
                                    item.amount
                                  )} ${currency} (${item.percent}%)`
                              )
                              .join(", ")
                          : "Brak danych"}
                      </span>
                    </div>

                    <div>
                      <strong>
                        {formatMoney(getExpenseOriginalAmount(expense))}{" "}
                        {getExpenseOriginalCurrency(expense)}
                      </strong>
                      <span>
                        ≈ {formatMoney(getExpenseConvertedAmount(expense))}{" "}
                        {getExpenseBaseCurrency(expense)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </main>
    </Layout>
  );
}