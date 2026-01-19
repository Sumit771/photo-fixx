import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, Expense } from "../types";

const Summary = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      setOrders(ordersData);
    });

    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const expensesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Expense)
      );
      setExpenses(expensesData);
    });

    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const incomeGenerated = orders.reduce(
    (acc, order) => acc + (order.totalCharges || 0),
    0
  );
  const totalExpenses = expenses.reduce(
    (acc, expense) => acc + (expense.amount || 0),
    0
  );
  const totalOrders = orders.length;
  const totalAmountSpentOnAds = expenses
    .filter((expense) => expense.type === "Ads")
    .reduce((acc, expense) => acc + (expense.amount || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-emerald-200 transition-all hover:shadow-md">
        <h2 className="text-xs sm:text-sm font-medium text-emerald-600 uppercase tracking-wider">Income Generated</h2>
        <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2">₹{incomeGenerated.toLocaleString("en-IN")}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-rose-200 transition-all hover:shadow-md">
        <h2 className="text-xs sm:text-sm font-medium text-rose-600 uppercase tracking-wider">Total Expenses</h2>
        <p className="text-2xl sm:text-3xl font-bold text-rose-900 mt-2">₹{totalExpenses.toLocaleString("en-IN")}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-blue-200 transition-all hover:shadow-md">
        <h2 className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wider">Total Orders</h2>
        <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">{totalOrders}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-amber-200 transition-all hover:shadow-md">
        <h2 className="text-xs sm:text-sm font-medium text-amber-600 uppercase tracking-wider">
          Ad Spend
        </h2>
        <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-2">
          ₹{totalAmountSpentOnAds.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
};

export default Summary;
