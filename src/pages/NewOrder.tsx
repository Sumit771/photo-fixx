import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface Customer {
  name: string;
  phone: string;
}

const NewOrder = () => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [account, setAccount] = useState<"PhotoFixx" | "Framilo">("PhotoFixx");
  const [photoType, setPhotoType] = useState<"Digital" | "Framed">("Digital");
  const [totalCharges, setTotalCharges] = useState<number | string>("");
  const [upfrontPaid, setUpfrontPaid] = useState<number | string>("");
  const [dueAmount, setDueAmount] = useState(0);
  const [date, setDate] = useState("");
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextOrderNo, setNextOrderNo] = useState<number>(1);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const customers: { [key: string]: Customer } = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.customerName) {
          const key = data.customerName.toLowerCase();
          if (!customers[key]) {
            customers[key] = {
              name: data.customerName,
              phone: data.phone || "",
            };
          }
        }
      });
      setExistingCustomers(Object.values(customers));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const today = new Date();
    const date =
      today.getFullYear() +
      "-" +
      ("0" + (today.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + today.getDate()).slice(-2);
  }, []);

  useEffect(() => {
    const fetchMaxOrderNo = async () => {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("orderNo", "desc"), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const latestOrder = snapshot.docs[0].data();
          setNextOrderNo((latestOrder.orderNo || 0) + 1);
        } else {
          setNextOrderNo(1);
        }
      });
      return () => unsubscribe();
    };

    fetchMaxOrderNo();
  }, []);

  useEffect(() => {
    setDueAmount((Number(totalCharges) || 0) - (Number(upfrontPaid) || 0));
  }, [totalCharges, upfrontPaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await addDoc(collection(db, "orders"), {
        orderNo: nextOrderNo,
        customerName,
        phone,
        account,
        photoType,
        totalCharges: Number(totalCharges) || 0,
        upfrontPaid: Number(upfrontPaid) || 0,
        dueAmount,
        date: Timestamp.fromDate(new Date(date)),
        status: "Pending",
        paymentStatus: "Unpaid",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      // Increment nextOrderNo for the next order
      setNextOrderNo(prev => prev + 1);
      // Optionally, reset the form or show a success message
      setCustomerName("");
      setPhone("");
      setAccount("PhotoFixx");
      setPhotoType("Digital");
      setTotalCharges("");
      setUpfrontPaid("");
      setSuccessMessage("Order created successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMessage("Failed to create order. Please try again.");
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.length > 0) {
      const filteredSuggestions = existingCustomers
        .filter((customer) =>
          customer.name.toLowerCase().includes(value.toLowerCase())
        )
        .map((customer) => customer.name);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    const customer = existingCustomers.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (customer) {
      setCustomerName(customer.name);
      setPhone(customer.phone);
    }
    setSuggestions([]);
  };

  return (
    <div className="max-w-full overflow-x-hidden p-4">
      <h1 className="text-2xl font-bold mb-4">New Order</h1>
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}
      <form
        className="bg-white shadow-md rounded px-4 md:px-8 pt-6 pb-8 mb-4 w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <div className="mb-4 relative">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="customerName"
          >
            Customer Name
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="customerName"
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={handleNameChange}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="phone"
          >
            Phone
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="phone"
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="account"
          >
            Account
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="account"
            value={account}
            onChange={(e) => setAccount(e.target.value as "PhotoFixx" | "Framilo")}
          >
            <option>PhotoFixx</option>
            <option>Framilo</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="photoType"
          >
            Photo Type
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="photoType"
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value as "Digital" | "Framed")}
          >
            <option>Digital</option>
            <option>Framed</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="totalCharges"
          >
            Total Charges
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="totalCharges"
            type="number"
            placeholder="Total Charges"
            value={totalCharges}
            onChange={(e) => setTotalCharges(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="upfrontPaid"
          >
            Upfront Paid
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="upfrontPaid"
            type="number"
            placeholder="Upfront Paid"
            value={upfrontPaid}
            onChange={(e) => setUpfrontPaid(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="dueAmount"
          >
            Due
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="dueAmount"
            type="number"
            placeholder="Due"
            value={dueAmount}
            readOnly
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="date"
          >
            Date
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-white leading-tight focus:outline-none focus:shadow-outline"
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
