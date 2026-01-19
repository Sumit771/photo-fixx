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
import { Edit, Delete } from "@mui/icons-material";

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
    <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Expenses</h1>
      <form
        className="bg-white shadow-sm border border-gray-100 rounded-2xl px-4 md:px-8 pt-6 pb-8 mb-6 w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            id="amount"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-medium mb-2"
            htmlFor="type"
          >
            Type
          </label>
          <select
            className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
            className="border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-colors w-full"
            type="submit"
          >
            {editingExpense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </form>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-medium mb-2"
          htmlFor="filter"
        >
          Filter by Type
        </label>
        <select
          className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full max-w-xs focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto mt-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">₹{expense.amount}</td>
                <td className="px-6 py-4 text-gray-600">{expense.type}</td>
                <td className="px-6 py-4 text-gray-500">
                  {expense.createdAt.toDate().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <button
                    className="border border-amber-200 text-amber-600 bg-white hover:bg-amber-50 font-medium py-1.5 px-3 rounded-xl mr-2 transition-colors text-sm"
                    onClick={() => handleEdit(expense)}
                  >
                    Edit
                  </button>
                  <button
                    className="border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 font-medium py-1.5 px-3 rounded-xl transition-colors text-sm"
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

      {/* Mobile View: Cards */}
      <div className="block md:hidden space-y-4 mt-8">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="bg-white shadow-sm border border-gray-100 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-gray-800">{expense.type}</h4>
              <span className="text-gray-900 font-bold">₹{expense.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-xs">
                {expense.createdAt.toDate().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex gap-2">
              <button
                className="text-amber-600 bg-amber-50 p-1.5 rounded-lg"
                onClick={() => handleEdit(expense)}
              >
                <Edit fontSize="small" />
              </button>
              <button
                className="text-rose-600 bg-rose-50 p-1.5 rounded-lg"
                onClick={() => handleDelete(expense.id!)}
              >
                <Delete fontSize="small" />
              </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Expenses;
