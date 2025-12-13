import { Timestamp } from "firebase/firestore";

export type Order = {
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
  status: "Pending" | "Printing" | "Ready" | "Delivered" | "Completed";
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  expenditure?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Price = {
  id?: string;
  photoType: string;
  price: number;
};

export type Expense = {
  id?: string;
  amount: number;
  type: "Frame" | "Courier" | "Ads" | "Petrol" | "Others";
  createdAt: Timestamp;
};
