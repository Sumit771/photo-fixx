import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link } from 'react-router-dom';

interface Order {
  id?: string;
  orderNo: number;
  customerName: string;
  phone?: string;
  email?: string;
  photoType: "Framed" | "Digital";
  totalCharges: number;
  upfrontPaid: number;
  dueAmount: number;
  date: Timestamp;
  status: "Pending" | "Printing" | "Ready" | "Delivered";
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  expenditure?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Expense {
  amount: number;
  type: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  color: string;
}

function Summary({ data }: { data: SummaryCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {data.map((item) => (
        <div key={item.title} className={`p-4 rounded-lg text-white shadow-lg ${item.color}`}>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-2xl font-bold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function PendingOrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <div className="text-center p-4">No pending orders.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Pending Orders</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Order No</th>
              <th scope="col" className="px-6 py-3">Customer Name</th>
              <th scope="col" className="px-6 py-3">Total Charges</th>
              <th scope="col" className="px-6 py-3">Due Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderNo} className="bg-white border-b">
                <td className="px-6 py-4">
                  <Link to={`/orders`} className="text-blue-600 hover:underline">
                    {order.orderNo}
                  </Link>
                </td>
                <td className="px-6 py-4">{order.customerName}</td>
                <td className="px-6 py-4">₹{order.totalCharges.toLocaleString("en-IN")}</td>
                <td className="px-6 py-4 text-red-600">₹{order.dueAmount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    // Set up a real-time listener for the 'orders' collection
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map((doc) => doc.data() as Order));
    });

    // Set up a real-time listener for the 'expenses' collection
    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => doc.data() as Expense));
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const loading = orders === null || expenses === null;

  if (loading) {
    return <div className="text-center p-4">Loading Dashboard...</div>;
  }

  const pendingOrders = orders.filter((order) => order.status === 'Pending');

  // Calculate summary metrics from the fetched data
  const incomeGenerated = pendingOrders.reduce((sum, order) => sum + (order.totalCharges || 0), 0);
  const totalOrders = orders.length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const adsExpenses = expenses
    .filter((expense) => expense.type === "Ads")
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const summaryData: SummaryCardProps[] = [
    { title: "Income Generated", value: `₹${incomeGenerated.toLocaleString("en-IN")}`, color: "bg-green-500" },
    { title: "Total Expenses", value: `₹${totalExpenses.toLocaleString("en-IN")}`, color: "bg-red-500" },
    { title: "Total Orders", value: totalOrders.toString(), color: "bg-blue-500" },
    { title: "Total Amount spent on Ads", value: `₹${adsExpenses.toLocaleString("en-IN")}`, color: "bg-yellow-500" },
  ];

  return (
    <>
      <Summary data={summaryData} />
      <PendingOrdersList orders={pendingOrders} />
    </>
  );
};

export default Dashboard;