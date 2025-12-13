import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Expense } from "../types";

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState<string | number>("");
  const [type, setType] = useState<
    "Frame" | "Courier" | "Ads" | "Petrol" | "Others"
  >("Others");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const expensesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Expense)
      );
      setExpenses(expensesData);
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        const expenseDoc = doc(db, "expenses", editingExpense.id!);
        await updateDoc(expenseDoc, { amount: Number(amount) || 0, type });
        setEditingExpense(null);
      } else {
        await addDoc(collection(db, "expenses"), {
          amount: Number(amount) || 0,
          type,
          createdAt: Timestamp.now(),
        });
      }
      setAmount("");
      setType("Others");
    } catch (error) {
      console.error("Error adding/updating document: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount);
    setType(expense.type);
  };

  const filteredExpenses = expenses.filter((expense) =>
    filter ? expense.type === filter : true
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <form
        className="bg-white shadow-md rounded px-4 md:px-8 pt-6 pb-8 mb-4 w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="amount"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="type"
          >
            Type
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="type"
            value={type}
            onChange={(e) =>
              setType(
                e.target.value as
                | "Frame"
                | "Courier"
                | "Ads"
                | "Petrol"
                | "Others"
              )
            }
          >
            <option>Frame</option>
            <option>Courier</option>
            <option>Ads</option>
            <option>Petrol</option>
            <option>Others</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            {editingExpense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </form>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="filter"
        >
          Filter by Type
        </label>
        <select
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option>Frame</option>
          <option>Courier</option>
          <option>Ads</option>
          <option>Petrol</option>
          <option>Others</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border px-4 py-2">{expense.amount}</td>
                <td className="border px-4 py-2">{expense.type}</td>
                <td className="border px-4 py-2">
                  {expense.createdAt.toDate().toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
                    onClick={() => handleEdit(expense)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => handleDelete(expense.id!)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
