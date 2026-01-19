import { Order } from "../types";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Timestamp } from "firebase/firestore";
import {
  CurrencyRupee,
  Paid,
  Close,
  Event,
  CameraAlt,
} from "@mui/icons-material";

interface ClientOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  orders: Order[];
}

const ClientOrdersModal = ({
  isOpen,
  onClose,
  clientName,
  orders,
}: ClientOrdersModalProps) => {
  // Sort orders by date, latest first
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = (a.date as unknown as Timestamp).toDate().getTime();
    const dateB = (b.date as unknown as Timestamp).toDate().getTime();
    return dateB - dateA;
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>{clientName}'s Orders</span>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <Close />
                  </button>
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  {sortedOrders.map((order) => {
                    const dueAmount = order.totalCharges - order.upfrontPaid;
                    const isPaid = dueAmount <= 0;
                    return (
                      <div
                        key={order.id}
                        className="p-4 border rounded-lg shadow-sm bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center text-gray-600">
                              <Event fontSize="small" className="mr-2" />
                              <span>
                                {(
                                  order.date as unknown as Timestamp
                                )
                                  .toDate()
                                  .toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <CameraAlt fontSize="small" className="mr-2" />
                              <span>{order.photoType}</span>
                            </div>
                          </div>
                          <div
                            className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                              isPaid
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isPaid ? "Paid" : "Due"}
                          </div>
                        </div>

                        <div className="mt-4 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-gray-600">
                              <CurrencyRupee
                                fontSize="small"
                                className="mr-1"
                              />{" "}
                              Total
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
                          {dueAmount > 0 && (
                            <div className="flex items-center justify-between text-red-600">
                              <span className="flex items-center">
                                <CurrencyRupee
                                  fontSize="small"
                                  className="mr-1"
                                />{" "}
                                Due
                              </span>
                              <span className="font-bold">
                                ₹{dueAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ClientOrdersModal;