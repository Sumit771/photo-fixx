import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order } from "../types";
import {
  Done,
  Delete,
  ExpandMore,
  ExpandLess,
  CameraAlt,
  Event,
  CurrencyRupee,
  Paid,
  Edit,
  AttachMoney,
  Close,
} from "@mui/icons-material";
import ClientOrdersModal from "../components/ClientOrdersModal";

const EditOrderModal = ({
  isOpen,
  onClose,
  order,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (updatedOrder: any) => void;
}) => {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
        date: (order.date as unknown as Timestamp).toDate().toISOString().split("T")[0],
      });
    }
  }, [order]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      totalCharges: Number(formData.totalCharges),
      upfrontPaid: Number(formData.upfrontPaid),
      date: Timestamp.fromDate(new Date(formData.date)),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 ">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Order</h2>
          <button onClick={onClose}><Close /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input name="customerName" value={formData.customerName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo Type</label>
            <select name="photoType" value={formData.photoType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
              <option>Digital</option>
              <option>Framed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Charges</label>
            <input type="number" name="totalCharges" value={formData.totalCharges} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upfront Paid</label>
            <input type="number" name="upfrontPaid" value={formData.upfrontPaid} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

const PaymentModal = ({
  isOpen,
  onClose,
  onSave,
  dueAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  dueAmount: number;
}) => {
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Number(amount));
    setAmount("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Partial Payment</h2>
          <button onClick={onClose}><Close /></button>
        </div>
        <p className="mb-4 text-sm text-gray-600">Current Due: ₹{dueAmount}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              max={dueAmount}
              min={1}
              required
            />
          </div>
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Add Payment</button>
        </form>
      </div>
    </div>
  );
};

// It's good practice to have a separate component for the order card to avoid repetition.
const OrderCard = ({
  order,
  onUpdateStatus,
  onDeleteOrder,
  onClientNameClick,
  onEdit,
  onAddPayment,
  onCloseOrder,
}: {
  order: Order;
  onUpdateStatus: (id: string, currentStatus: string) => void;
  onDeleteOrder: (id: string) => void;
  onClientNameClick: (clientName: string, phone?: string) => void;
  onEdit: (order: Order) => void;
  onAddPayment: (order: Order) => void;
  onCloseOrder: (id: string) => void;
}) => {
  const dueAmount = order.totalCharges - order.upfrontPaid;
  const statusPillClass =
    order.status === "Completed"
      ? "bg-emerald-100 text-emerald-800"
    
      : "bg-amber-100 text-amber-800";

  return (
    <div className="relative p-4 sm:p-6 border border-gray-200 rounded-2xl shadow-sm bg-slate-50 flex flex-col h-full transition-all hover:shadow-md w-[95%] mx-auto">
      <div
        className={`absolute top-3 right-3 sm:top-4 sm:right-4 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusPillClass}`}
      >
        {order.status}
      </div>
      {/* The user mentioned the name is not showing. It's likely `customerName` from NewOrder.tsx, not `clientName`. */}
      <h2
        className="text-lg font-bold text-gray-800 pr-16 sm:pr-20 truncate cursor-pointer"
        onClick={() => onClientNameClick(order.customerName, order.phone)}
      >
        {order.customerName}
      </h2>

      <div className="flex-grow my-3 space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center">
            <CameraAlt fontSize="small" className="mr-2" />
            <span>Photo Type: {order.photoType}</span>
          </div>
          <span className="font-bold text-gray-500" title={(order as any).account || "PhotoFixx"}>
            {(order as any).account === "Framilo" ? "F" : "P"}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center">
            <Event fontSize="small" className="mr-2" />
            <span>
              Date:{" "}
              {(order.date as unknown as Timestamp).toDate().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          {order.status === "Pending" && (
            <button
              onClick={() => order.id && onCloseOrder(order.id)}
              className="text-gray-400 hover:text-red-500"
              title="Close Order (Not Responded)"
            >
              <Close fontSize="small" />
            </button>
          )}
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-gray-600">
              <CurrencyRupee fontSize="small" className="mr-1" /> Total
            </span>
            <span className="font-semibold text-gray-800">
              ₹{order.totalCharges.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between text-green-600">
            <span className="flex items-center">
              <Paid fontSize="small" className="mr-1" /> Paid
            </span>
            <span className="font-semibold">
              ₹{order.upfrontPaid.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between text-red-600">
            <span className="flex items-center">
              <CurrencyRupee fontSize="small" className="mr-1" /> Due
            </span>
            <span className="font-bold">
              ₹{dueAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-auto pt-4 gap-2">
        <button
          onClick={() => onEdit(order)}
          className="p-2 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
          title="Edit"
        >
          <Edit fontSize="small" />
        </button>
        {order.status !== "Completed" && dueAmount > 0 && (
          <button
            onClick={() => onAddPayment(order)}
            className="p-2 bg-white border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center"
            title="Add Payment"
          >
            <AttachMoney fontSize="small" />
          </button>
        )}
        <button
          onClick={() => order.id && onUpdateStatus(order.id, order.status)}
          className="p-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center"
          title={order.status === "Pending" ? "Mark Completed" : "Completed"}
        >
          <Done fontSize="small" />
        </button>
        <button
          onClick={() => order.id && onDeleteOrder(order.id)}
          className="p-2 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center"
          title="Delete"
        >
          <Delete fontSize="small" />
        </button>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = collection(db, "orders");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orders.forEach((order) => {
      if (order.date) {
        const date = (order.date as unknown as Timestamp).toDate();
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        months.add(monthStr);
      }
    });
    return Array.from(months).sort().reverse();
  }, [orders]);

  const processedOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by Status
    if (statusFilter !== "All") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by Month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      filtered = filtered.filter((order) => {
        const orderDate = (order.date as unknown as Timestamp).toDate();
        return (
          orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month
        );
      });
    }

    // Search
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(lowercasedQuery) ||
          order.phone?.includes(lowercasedQuery)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = (a.date as unknown as Timestamp).toDate().getTime();
      const dateB = (b.date as unknown as Timestamp).toDate().getTime();
      const dueA = a.totalCharges - a.upfrontPaid;
      const dueB = b.totalCharges - b.upfrontPaid;

      switch (sortBy) {
        case "date-asc":
          return dateA - dateB;
        case "due-desc":
          return dueB - dueA;
        case "due-asc":
          return dueA - dueB;
        case "date-desc":
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [orders, searchQuery, sortBy, statusFilter, selectedMonth]);

  const totalRevenue = useMemo(() => {
    return processedOrders.reduce((sum, order) => sum + (order.totalCharges || 0), 0);
  }, [processedOrders]);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const allCount = orders.length;

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === "Pending") {
      const firstConfirmation = window.confirm(
        "Are you sure you want to mark this order as Completed?"
      );
      if (firstConfirmation) {
        const secondConfirmation = window.confirm(
          "This will finalize the order and update the finances. This action cannot be undone. Are you absolutely sure?"
        );
        if (secondConfirmation) {
          const orderDoc = doc(db, "orders", id);
          const order = orders.find((o) => o.id === id);

          if (order) {
            let updatedData: any = {
              status: "Completed",
              updatedAt: Timestamp.now(),
            };

            updatedData = {
              ...updatedData,
              upfrontPaid: order.totalCharges,
              dueAmount: 0,
            };

            await updateDoc(orderDoc, updatedData);
          }
        }
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    // Add confirmation before deleting
    if (window.confirm("Are you sure you want to delete this order?")) {
      const orderDoc = doc(db, "orders", id);
      await deleteDoc(orderDoc);
    }
  };

  const handleCloseOrder = async (id: string) => {
    if (window.confirm("Are you sure you want to close this order (Client not responded)?")) {
      const orderDoc = doc(db, "orders", id);
      await updateDoc(orderDoc, {
        status: "Cancelled",
        updatedAt: Timestamp.now(),
      });
    }
  };

  const handleClientNameClick = (clientName: string, phone?: string) => {
    setSelectedClient(clientName);
    setSelectedClientPhone(phone || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setSelectedClientPhone(null);
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedOrder: any) => {
    if (selectedOrder && selectedOrder.id) {
      const orderDoc = doc(db, "orders", selectedOrder.id);
      const dueAmount = updatedOrder.totalCharges - updatedOrder.upfrontPaid;
      await updateDoc(orderDoc, {
        ...updatedOrder,
        dueAmount,
        updatedAt: Timestamp.now(),
      });
      setEditModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const handlePaymentClick = (order: Order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async (amount: number) => {
    if (selectedOrder && selectedOrder.id) {
      const orderDoc = doc(db, "orders", selectedOrder.id);
      const newUpfrontPaid = selectedOrder.upfrontPaid + amount;
      const newDueAmount = selectedOrder.totalCharges - newUpfrontPaid;
      
      await updateDoc(orderDoc, {
        upfrontPaid: newUpfrontPaid,
        dueAmount: newDueAmount,
        status: newDueAmount <= 0 ? "Completed" : selectedOrder.status,
        updatedAt: Timestamp.now(),
      });
      setPaymentModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter((order) => order.customerName === selectedClient);
  }, [selectedClient, orders]);

  return (
    <div className="container mx-auto p-4 md:p-0 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            statusFilter === "Pending"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setStatusFilter("Pending")}
        >
          Pending
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${statusFilter === "Pending" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
            {pendingCount}
          </span>
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            statusFilter === "Completed"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setStatusFilter("Completed")}
        >
          Completed
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${statusFilter === "Completed" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
            {completedCount}
          </span>
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            statusFilter === "All"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 rounded-t-lg"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setStatusFilter("All")}
        >
          All
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${statusFilter === "All" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
            {allCount}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search by Name / Phone
          </label>
          <input
            id="search"
            type="text"
            placeholder="e.g. John Doe or 987..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="monthFilter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Month
          </label>
          <select
            id="monthFilter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          >
            <option value="">All Months</option>
            {availableMonths.map((monthStr) => {
              const [year, month] = monthStr.split("-").map(Number);
              const date = new Date(year, month - 1);
              return (
                <option key={monthStr} value={monthStr}>
                  {date.toLocaleString("default", { month: "long", year: "numeric" })}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label
            htmlFor="sortBy"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2.5 rounded-xl border-gray-200 bg-gray-50 w-full focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="due-desc">Due Amount (High to Low)</option>
            <option value="due-asc">Due Amount (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <span className="text-gray-600 font-medium">Showing {processedOrders.length} orders</span>
        <span className="text-lg font-bold text-gray-700">
          Total Revenue: <span className="text-green-600">₹{totalRevenue.toLocaleString("en-IN")}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {processedOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={handleUpdateStatus}
            onDeleteOrder={handleDeleteOrder}
            onClientNameClick={handleClientNameClick}
            onEdit={handleEditClick}
            onAddPayment={handlePaymentClick}
            onCloseOrder={handleCloseOrder}
          />
        ))}
      </div>

      {selectedClient && (
        <ClientOrdersModal
          isOpen={isModalOpen}
          onClose={closeModal}
          clientName={`${selectedClient} ${selectedClientPhone ? `(${selectedClientPhone})` : ""}`}
          orders={clientOrders}
        />
      )}

      <EditOrderModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        order={selectedOrder}
        onSave={handleSaveEdit}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSave={handleSavePayment}
        dueAmount={selectedOrder ? selectedOrder.totalCharges - selectedOrder.upfrontPaid : 0}
      />
    </div>
  );
};

export default Orders;