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
        <div key={item.title} className={`p-6 rounded-2xl text-white shadow-sm ${item.color}`}>
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
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Orders</h3>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">Order No</th>
              <th scope="col" className="px-6 py-3 font-medium">Customer Name</th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell font-medium">Total Charges</th>
              <th scope="col" className="px-6 py-3 font-medium">Due Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderNo} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/orders`} className="text-blue-600 hover:underline">
                    {order.orderNo}
                  </Link>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{order.customerName}</td>
                <td className="px-6 py-4 hidden md:table-cell text-gray-600">₹{order.totalCharges.toLocaleString("en-IN")}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">₹{order.dueAmount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.orderNo} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link to={`/orders`} className="text-blue-600 font-bold hover:underline">
                  #{order.orderNo}
                </Link>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Due</p>
                <p className="text-rose-600 font-bold">₹{order.dueAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
               <span>Total: ₹{order.totalCharges.toLocaleString("en-IN")}</span>
            </div>
          </div>
        ))}
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
    <div className="w-full min-w-0 overflow-x-hidden">
      <Summary data={summaryData} />
      <PendingOrdersList orders={pendingOrders} />
    </div>
  );
};

export default Dashboard;