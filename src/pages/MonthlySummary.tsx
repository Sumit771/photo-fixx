import { useState, useEffect } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Order {
  id: string;
  totalCharges: number;
  date: Timestamp;
}

interface Expense {
  id: string;
  amount: number;
  type: "Frame" | "Courier" | "Ads" | "Petrol" | "Others";
  createdAt: Timestamp;
}

interface MonthlySummaryData {
  month: string;
  totalOrders: number;
  adSpent: number;
  totalExpenses: number;
  totalIncome: number;
  realisedEarning: number;
}

const MonthlySummary = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlySummaryData[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      setExpenses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  useEffect(() => {
    if (!orders || !expenses) return;

    const calculateSummary = () => {
      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison

      const filteredOrders = orders.filter(order => {
        if (!order.date || !(order.date instanceof Timestamp)) return false;
        const orderDate = order.date.toDate();
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
        return true;
      });

      const filteredExpenses = expenses.filter(expense => {
        if (!expense.createdAt || !(expense.createdAt instanceof Timestamp)) return false;
        const expenseDate = expense.createdAt.toDate();
        if (start && expenseDate < start) return false;
        if (end && expenseDate > end) return false;
        return true;
      });

      const summaries: { [key: string]: MonthlySummaryData } = {};

      filteredOrders.forEach((order) => {
        const orderDate = order.date.toDate();
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        const monthName = orderDate.toLocaleString("default", { month: "long", year: "numeric" });

        if (!summaries[monthKey]) {
          summaries[monthKey] = { month: monthName, totalOrders: 0, adSpent: 0, totalExpenses: 0, totalIncome: 0, realisedEarning: 0 };
        }
        summaries[monthKey].totalOrders += 1;
        summaries[monthKey].totalIncome += order.totalCharges || 0;
      });

      filteredExpenses.forEach((expense) => {
        const expenseDate = expense.createdAt.toDate();
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
        const monthName = expenseDate.toLocaleString("default", { month: "long", year: "numeric" });

        if (!summaries[monthKey]) {
          summaries[monthKey] = { month: monthName, totalOrders: 0, adSpent: 0, totalExpenses: 0, totalIncome: 0, realisedEarning: 0 };
        }
        summaries[monthKey].totalExpenses += expense.amount || 0;
        if (expense.type === "Ads") {
          summaries[monthKey].adSpent += expense.amount || 0;
        }
      });

      const processedData = Object.values(summaries).map((summary) => ({
        ...summary,
        realisedEarning: summary.totalIncome - summary.totalExpenses,
      }));

      processedData.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

      setMonthlyData(processedData);
    };

    calculateSummary();
  }, [orders, expenses, startDate, endDate]);

  const loading = orders === null || expenses === null;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // Set document properties for better metadata
    doc.setProperties({
      title: "Monthly Summary Report",
      subject: "Financial overview of monthly orders and expenses",
      author: "Photo-Fixx",
      creator: "Photo-Fixx Application",
    });

    // Header - Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold"); // Reverted to helvetica font
    doc.setTextColor(40, 40, 40); // Dark gray color
    doc.text("Monthly Summary Report", 14, 25); // X, Y coordinates

    // Table generation with modern styling
    autoTable(doc, {
      startY: 35, // Start table below the title
      head: [["Month", "Total Orders", "Ad Spent (INR)", "Total Expenses (INR)", "Realised Earning (INR)"]],
      body: monthlyData.map((data) => [
        data.month,
        data.totalOrders,
        `${data.adSpent.toLocaleString("en-IN")}`,
        `${data.totalExpenses.toLocaleString("en-IN")}`,
        `${data.realisedEarning.toLocaleString("en-IN")}`,
      ]),
      theme: "striped", // Use striped theme for alternating row colors
      styles: {
        font: "helvetica", // Reverted to helvetica font
        fontSize: 10,
        cellPadding: 3,
        textColor: [50, 50, 50], // Slightly lighter text color
        lineColor: [180, 180, 180], // Light grey borders
        lineWidth: 0.1,
      },
      headStyles: {
        font: "helvetica", // Reverted to helvetica font
        fillColor: [230, 230, 230], // Light grey header background
        textColor: [0, 0, 0], // Black text for headers
        fontStyle: "bold",
        halign: "center", // Center align header text
        valign: "middle",
        fontSize: 11,
        minCellHeight: 10,
        lineColor: [150, 150, 150], // Slightly darker border for header
        lineWidth: 0.1,
      },
      bodyStyles: {
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Very light grey for alternate rows
      },
      columnStyles: {
        // Example: Align numerical columns to the right
        1: { halign: "right" }, // Total Orders
        2: { halign: "right" }, // Ad Spent
        3: { halign: "right" }, // Total Expenses
        4: { halign: "right" }, // Realised Earning
      },
      // Footer - Page number and date
      didDrawPage: function (data) {
        doc.setFontSize(10);
        doc.setTextColor(150); // Grey color for footer text
        const pageCount = doc.getNumberOfPages();
        const currentDate = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        // Page number
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );

        // Current Date
        doc.text(
          `Generated on: ${currentDate}`,
          doc.internal.pageSize.width - data.settings.margin.right - doc.getTextWidth(`Generated on: ${currentDate}`),
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save("monthly-summary.pdf");
  };

  return (
    <div className="max-w-full px-4 py-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Monthly Summary</h1>
        <button onClick={handleDownloadPdf} disabled={monthlyData.length === 0} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 md:px-4 rounded disabled:bg-gray-400 text-sm md:text-base">
          <span className="hidden md:inline">Download PDF</span>
          <span className="inline md:hidden">PDF</span>
        </button>
      </div>
      <div className="bg-white shadow-md rounded px-4 md:px-8 pt-6 pb-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
              Start Date
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
              End Date
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Clear Filter
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-600">Loading summary...</p>
      ) : monthlyData.length === 0 ? (
        <p className="text-gray-600">No data available to generate a summary.</p>
      ) : (
              <>
                <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
                  <table className="min-w-full text-left table-auto">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Spent</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Realised Earning</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyData.map((data) => (
                        <tr key={data.month}>
                          <td className="px-3 py-4 text-sm font-medium text-gray-900">{data.month}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">{data.totalOrders}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">₹{data.adSpent.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">₹{data.totalExpenses.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">₹{data.realisedEarning.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
      
                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="bg-white shadow-md rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-2">{data.month}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Total Orders:</span> {data.totalOrders}
                        </div>
                        <div>
                          <span className="font-medium">Ad Spent:</span> ₹{data.adSpent.toLocaleString("en-IN")}
                        </div>
                        <div>
                          <span className="font-medium">Total Expenses:</span> ₹{data.totalExpenses.toLocaleString("en-IN")}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Realised Earning:</span> ₹{data.realisedEarning.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
    </div>
  );
};

export default MonthlySummary;
