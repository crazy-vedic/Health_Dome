import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  AlertTriangle,
  PackageOpen,
  Search,
  DollarSign,
  Calendar,
} from "lucide-react";

const hospitals = [
  { name: "Bhardwaj Hospital", url: "http://localhost:5000" },
  // { name: "Balaji Soni Hospital", url: "http://vedicvarma.com:5000" },
  // { name: "Agrawal Hospital", url: "http://192.168.31.1:5000" },
];

const THRESHOLD = 5; // Set the threshold value here

const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </motion.div>
);

const HospitalInventoryManager = () => {
  const [currentHospitalIndex, setCurrentHospitalIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);
  const [medId, setMedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showThresholdAlert, setShowThresholdAlert] = useState(false);
  const [thresholdMed, setThresholdMed] = useState(null);

  const currentHospital = hospitals[currentHospitalIndex];

  useEffect(() => {
    fetchInventory();
  }, [currentHospitalIndex]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${currentHospital.url}/medicines`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError("Failed to load inventory. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevHospital = () => {
    setCurrentHospitalIndex((prevIndex) =>
      prevIndex === 0 ? hospitals.length - 1 : prevIndex - 1
    );
  };

  const handleNextHospital = () => {
    setCurrentHospitalIndex((prevIndex) => (prevIndex + 1) % hospitals.length);
  };

  const handleOpenDialog = (type, med = null) => {
    setTransactionType(type);
    setIsDialogOpen(true);
    if (med) {
      setSelectedMed(med);
      setMedId(med[0].toString());
      if (type === "buy" && med[3] <= THRESHOLD) {
        setQuantity(THRESHOLD - med[3] + 1);
      } else {
        setQuantity(1);
      }
    } else {
      setSelectedMed(null);
      setMedId("");
      setQuantity(1);
    }
  };

  const handleMedIdChange = (e) => {
    const id = e.target.value;
    setMedId(id);
    const med = inventory.find((m) => m[0].toString() === id);
    setSelectedMed(med || null);
    if (med && transactionType === "buy" && med[3] <= THRESHOLD) {
      setQuantity(THRESHOLD - med[3] + 1);
    } else {
      setQuantity(1);
    }
  };

  const handleTransaction = async () => {
    if (!selectedMed) return;

    const currentQuantity = selectedMed[3];
    const newQuantity =
      transactionType === "buy"
        ? currentQuantity + quantity
        : Math.max(0, currentQuantity - quantity);

    try {
      const response = await fetch(`${currentHospital.url}/set_medicine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Qty: newQuantity,
          MediID: selectedMed[0],
        }),
      });

      if (!response.ok) throw new Error("Failed to update inventory");
      await fetchInventory();
      setIsDialogOpen(false);

      // Check if the new quantity is at or below the threshold after a sale
      if (transactionType === "sell" && newQuantity <= THRESHOLD) {
        setThresholdMed({ ...selectedMed, 3: newQuantity });
        setShowThresholdAlert(true);
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  const handleBuyThresholdMed = () => {
    setShowThresholdAlert(false);
    handleOpenDialog("buy", thresholdMed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-7xl mx-auto"
      >
        {/* Hospital Navigation Header */}
        <motion.div 
          className="flex justify-between items-center mb-12"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevHospital}
            className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 font-medium py-3 px-6 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300"
          >
            <ChevronLeft size={20} />
            Previous
          </motion.button>

          <motion.h1
            className="text-4xl font-bold text-gray-800 bg-white/50 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            {currentHospital.name}
          </motion.h1>

          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextHospital}
            className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 font-medium py-3 px-6 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300"
          >
            Next
            <ChevronRight size={20} />
          </motion.button>
        </motion.div>

        {/* Action Buttons and Search */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenDialog("buy")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300"
            >
              <Plus size={20} />
              Buy Medicine
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenDialog("sell")}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-rose-200 transition-all duration-300"
            >
              <Minus size={20} />
              Sell Medicine
            </motion.button>
          </div>
          
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search medicines..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </motion.div>

        {loading && <LoadingSpinner />}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl"
          >
            {error}
          </motion.div>
        )}
        
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Med ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Medicine Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((med, index) => (
                    <motion.tr 
                      key={med[0]}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                      className={`border-t border-gray-100 cursor-pointer
                        ${med[3] <= THRESHOLD ? 'bg-red-50/50' : ''}
                      `}
                    >
                      <td className="px-6 py-4">{med[0]}</td>
                      <td className="px-6 py-4 font-medium">{med[1]}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <PackageOpen size={16} className="text-gray-400" />
                          <span className={med[3] <= THRESHOLD ? 'text-red-600 font-medium' : ''}>
                            {med[3]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          Rs {med[2]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {med[4]}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Transaction Dialog */}
        <AnimatePresence>
          {isDialogOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsDialogOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  y: 0, 
                  opacity: 1,
                  transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 400
                  }
                }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                  {transactionType === "buy" ? "Buy Medicine" : "Sell Medicine"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine ID
                    </label>
                    <input
                      type="text"
                      value={medId}
                      onChange={handleMedIdChange}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>

                  {selectedMed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 bg-gray-50 p-6 rounded-xl"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm text-gray-500 mb-1">Medicine Name</span>
                          <span className="font-medium">{selectedMed[1]}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 mb-1">Current Price</span>
                          <span className="font-medium">Rs {selectedMed[2]}</span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 mb-1">Available</span>
                          <span className="font-medium">{selectedMed[3]} units</span>
                        </div>
                        <div>
                          <span className="block text-sm text-gray-500 mb-1">Quantity</span>
                          <input
                            type="number"
                            min="1"
                            max={transactionType === "sell" ? selectedMed[3] : undefined}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-4 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsDialogOpen(false)}
                      className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTransaction}
                      disabled={!selectedMed}
                      className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm {transactionType === "buy" ? "Purchase" : "Sale"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Threshold Alert Dialog */}
        <AnimatePresence>
          {showThresholdAlert && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2 text-red-600">
                      Low Inventory Alert
                    </h2>
                    <p className="text-gray-600 mb-6">
                      The quantity of <span className="font-medium">{thresholdMed?.[1]}</span> is now at or below the threshold of {THRESHOLD}. Current quantity: <span className="font-medium text-red-600">{thresholdMed?.[3]}</span>
                        </p>
                    <div className="flex justify-end gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowThresholdAlert(false)}
                        className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200"
                      >
                        Dismiss
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBuyThresholdMed}
                        className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Order More
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default HospitalInventoryManager;