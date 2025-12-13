import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
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
} from "@mui/icons-material";
import ClientOrdersModal from "../components/ClientOrdersModal";

// It's good practice to have a separate component for the order card to avoid repetition.
const OrderCard = ({
  order,
  onUpdateStatus,
  onDeleteOrder,
  onClientNameClick,
}: {
  order: Order;
  onUpdateStatus: (id: string, currentStatus: string) => void;
  onDeleteOrder: (id: string) => void;
  onClientNameClick: (clientName: string) => void;
}) => {
  const dueAmount = order.totalCharges - order.upfrontPaid;
  const statusPillClass =
    order.status === "Completed"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";

  return (
    <div className="relative p-4 border rounded-lg shadow-md bg-white flex flex-col h-full">
      <div
        className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusPillClass}`}
      >
        {order.status}
      </div>
      {/* The user mentioned the name is not showing. It's likely `customerName` from NewOrder.tsx, not `clientName`. */}
      <h2
        className="text-lg font-bold text-gray-800 pr-20 truncate cursor-pointer"
        onClick={() => onClientNameClick(order.customerName)}
      >
        {order.customerName}
      </h2>

      <div className="flex-grow my-3 space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <CameraAlt fontSize="small" className="mr-2" />
          <span>Photo Type: {order.photoType}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Event fontSize="small" className="mr-2" />
          <span>
            Date:{" "}
            {(order.date as unknown as Timestamp).toDate().toLocaleDateString()}
          </span>
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

      <div className="flex justify-end mt-auto pt-2">
        <button
          onClick={() => order.id && onUpdateStatus(order.id, order.status)}
          className="mr-2 p-2 bg-green-500 text-white rounded flex items-center text-xs"
        >
          <Done fontSize="small" className="mr-1" />
          {order.status === "Pending" ? "Mark Completed" : "Completed"}
        </button>
        <button
          onClick={() => order.id && onDeleteOrder(order.id)}
          className="p-2 bg-red-500 text-white rounded flex items-center text-xs"
        >
          <Delete fontSize="small" className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    const q =
      statusFilter !== "All"
        ? query(collection(db, "orders"), where("status", "==", statusFilter))
        : collection(db, "orders");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [statusFilter]);

  const processedOrders = useMemo(() => {
    let filtered = [...orders];

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
  }, [orders, searchQuery, sortBy]);

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

            const dueAmount = order.totalCharges - order.upfrontPaid;
            const newTotalCharges = order.totalCharges + dueAmount;
            updatedData = {
              ...updatedData,
              totalCharges: newTotalCharges,
              upfrontPaid: newTotalCharges,
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

  const handleClientNameClick = (clientName: string) => {
    setSelectedClient(clientName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter((order) => order.customerName === selectedClient);
  }, [selectedClient, orders]);

  return (
    <div className="container mx-auto p-4 md:p-0">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg shadow">
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
            className="p-2 rounded border bg-white w-full shadow-sm"
          />
        </div>
        <div>
          <label
            htmlFor="statusFilter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded border bg-white w-full shadow-sm"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
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
            className="p-2 rounded border bg-white w-full shadow-sm"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="due-desc">Due Amount (High to Low)</option>
            <option value="due-asc">Due Amount (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={handleUpdateStatus}
            onDeleteOrder={handleDeleteOrder}
            onClientNameClick={handleClientNameClick}
          />
        ))}
      </div>

      {selectedClient && (
        <ClientOrdersModal
          isOpen={isModalOpen}
          onClose={closeModal}
          clientName={selectedClient}
          orders={clientOrders}
        />
      )}
    </div>
  );
};

export default Orders;