import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const hospitals = [
  { name: "Bhardwaj Hospital", url: "http://localhost:5000" },
  // { name: "Balaji Soni Hospital", url: "http://vedicvarma.com:5000" },
  // { name: "Agrawal Hospital", url: "http://192.168.31.1:5000" },
];

const LoadingSpinner = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
    />
  </motion.div>
);

const HospitalPatientsDisplay = () => {
  const [hospitalData, setHospitalData] = useState([]);
  const [currentHospitalIndex, setCurrentHospitalIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    Name: "",
    Phone: "",
    Age: "",
    Sex: "",
    needsBed: false,
  });
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const formControlVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: i => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  useEffect(() => {
    fetchAllHospitalData();
  }, []);

  const fetchAllHospitalData = async () => {
    try {
      const allData = await Promise.all(
        hospitals.map(async (hospital) => {
          const response = await fetch(`${hospital.url}/patients`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return { ...hospital, patients: data };
        })
      );
      setHospitalData(allData);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching hospital data:", e);
      setError(e.message);
      setLoading(false);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const response = await fetch(
        `${hospitals[currentHospitalIndex].url}/beds`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const availableBeds = data.filter((bed) => bed[3] === "Available");
      setAvailableBeds(availableBeds);
    } catch (e) {
      console.error("Error fetching available beds:", e);
      setError(e.message);
    }
  };

  const handlePrevious = () => {
    setCurrentHospitalIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : hospitals.length - 1
    );
  };

  const handleNext = () => {
    setCurrentHospitalIndex((prevIndex) =>
      prevIndex < hospitals.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleOpenAddPatientDialog = () => {
    setIsAddPatientDialogOpen(true);
    fetchAvailableBeds();
  };

  const handleCloseAddPatientDialog = () => {
    setIsAddPatientDialogOpen(false);
    setNewPatient({ Name: "", Phone: "", Age: "", Sex: "", needsBed: false });
    setSelectedBed(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPatient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "needsBed" && !checked) {
      setSelectedBed(null);
    }
  };

  const handleAddPatient = async () => {
    try {
      const response = await fetch(
        `${hospitals[currentHospitalIndex].url}/add_patient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPatient),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const patientData = await response.json();

      if (newPatient.needsBed && selectedBed) {
        await assignBed(patientData[0], selectedBed[0]);
      }

      handleCloseAddPatientDialog();
      fetchAllHospitalData();
    } catch (e) {
      console.error("Error adding patient:", e);
      setError(e.message);
    }
  };

  const assignBed = async (patientId, bedId) => {
    try {
      const response = await fetch(
        `${hospitals[currentHospitalIndex].url}/set_bed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Occupied",
            Pid: patientId,
            bedID: bedId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (e) {
      console.error("Error assigning bed:", e);
      setError(e.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (hospitalData.length === 0) {
    return <div>No hospital data available.</div>;
  }

  const currentHospital = hospitalData[currentHospitalIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 font-sans bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen"
    >
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <div className="flex justify-between items-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            ← Previous
          </motion.button>
          <motion.h1 
            className="text-3xl font-bold text-gray-800 bg-white px-8 py-4 rounded-lg shadow-sm"
            layoutId="hospitalTitle"
          >
            {currentHospital.name} Patients
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            Next →
          </motion.button>
        </div>

        <motion.div 
          className="mb-6"
          whileHover={{ scale: 1.02 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenAddPatientDialog}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            + Add Patient
          </motion.button>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          variants={fadeIn}
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Patient ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Age</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Sex</th>
              </tr>
            </thead>
            <tbody>
              {currentHospital.patients.map((patient, index) => (
                <motion.tr 
                  key={patient[0]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 border-t border-gray-100">{patient[0]}</td>
                  <td className="px-6 py-4 border-t border-gray-100">{patient[1]}</td>
                  <td className="px-6 py-4 border-t border-gray-100">{patient[2]}</td>
                  <td className="px-6 py-4 border-t border-gray-100">{patient[3]}</td>
                  <td className="px-6 py-4 border-t border-gray-100">{patient[4]}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <AnimatePresence>
          {isAddPatientDialogOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={handleCloseAddPatientDialog}
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold mb-6 text-gray-800"
                >
                  Add New Patient
                </motion.h2>

                {[
                  { label: "Name", name: "Name", type: "text" },
                  { label: "Phone", name: "Phone", type: "text" },
                  { label: "Age", name: "Age", type: "number" },
                  { label: "Sex", name: "Sex", type: "text" }
                ].map((field, i) => (
                  <motion.div
                    key={field.name}
                    custom={i}
                    variants={formControlVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-4"
                  >
                    <label className="block mb-1">{field.label}</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      name={field.name}
                      type={field.type}
                      value={newPatient[field.name]}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </motion.div>
                ))}

                <motion.div
                  variants={formControlVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  className="mb-4"
                >
                  <label className="flex items-center">
                    <motion.input
                      whileTap={{ scale: 0.9 }}
                      name="needsBed"
                      type="checkbox"
                      checked={newPatient.needsBed}
                      onChange={handleInputChange}
                      className="mr-2 w-4 h-4 text-indigo-500"
                    />
                    Needs Bed
                  </label>
                </motion.div>

                <AnimatePresence>
                  {newPatient.needsBed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <label className="block mb-1">Select Bed</label>
                      <motion.select
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        value={selectedBed ? selectedBed[0] : ""}
                        onChange={(e) => setSelectedBed(
                          availableBeds.find(bed => bed[0] === parseInt(e.target.value))
                        )}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select a bed</option>
                        {availableBeds.map((bed) => (
                          <option key={bed[0]} value={bed[0]}>
                            Bed {bed[0]} - {bed[1]} - {bed[2]}
                          </option>
                        ))}
                      </motion.select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  className="flex justify-end gap-4 mt-8"
                  variants={formControlVariants}
                  custom={5}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCloseAddPatientDialog}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddPatient}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Add Patient
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default HospitalPatientsDisplay;
