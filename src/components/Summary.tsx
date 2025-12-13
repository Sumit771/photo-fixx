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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-700">Income Generated</h2>
        <p className="text-2xl font-bold text-gray-900">${incomeGenerated}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-700">Total Expenses</h2>
        <p className="text-2xl font-bold text-gray-900">${totalExpenses}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-700">Total Orders</h2>
        <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-700">
          Total Amount spent on Ads
        </h2>
        <p className="text-2xl font-bold text-gray-900">
          ${totalAmountSpentOnAds}
        </p>
      </div>
    </div>
  );
};

export default Summary;
