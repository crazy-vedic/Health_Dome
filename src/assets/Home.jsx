import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  UserPlus,
  LayoutDashboard,
  LogIn,
  User,
  Bed,
  Package,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import BedAssignment from "./Beds";
import HospitalInventoryManager from "./Hospital_Inventory";
import HospitalPatientsDisplay from "./Patients";
import AppointmentAssist from "./Appointment";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="bg-white shadow-lg backdrop-blur-md bg-opacity-95 fixed w-full z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-blue-600 font-bold text-xl">
                  Health Dome
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <NavItem icon={<Home size={18} />} text="Home" to="/" />
                <NavItem
                  icon={<UserPlus size={18} />}
                  text="Create Health ID"
                  to="https://abha.abdm.gov.in/abha/v3/"
                />
                <NavItem
                  icon={<LayoutDashboard size={18} />}
                  text="Dashboard"
                  to="/dashboard"
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200">
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-blue-600 focus:outline-none"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden absolute w-full bg-white shadow-lg">
                <div className="px-4 py-3 space-y-2">
                  <MobileNavItem icon={<Home size={18} />} text="Home" to="/" />
                  <MobileNavItem
                    icon={<UserPlus size={18} />}
                    text="Create Health ID"
                    to="https://abha.abdm.gov.in/abha/v3/"
                  />
                  <MobileNavItem
                    icon={<LayoutDashboard size={18} />}
                    text="Dashboard"
                    to="/dashboard"
                  />
                  <MobileNavItem
                    icon={<LogIn size={18} />}
                    text="Login"
                    to="/login"
                  />
                </div>
              </div>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/Beds" element={<BedAllot />} />
          <Route path="/Hospital_Inventory" element={<Inven />} />
          <Route path="/Patients" element={<AllPatients />} />
          <Route path="/appointment-assist" element={<AppointmentAssist />} />
        </Routes>
      </div>
    </Router>
  );
};

const MainContent = () => {
  const navigate = useNavigate();

  return (
    <main className="pt-24 min-h-screen container mx-auto p-4">
      <div className="text-center mb-16 opacity-0 animate-fade-in">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
          Modern Healthcare Management
        </h1>
        <p className="text-gray-600 text-xl max-w-2xl mx-auto">
          Empowering healthcare professionals with cutting-edge management
          solutions
        </p>
      </div>

      {/* Featured Appointment Card */}
      <div className="max-w-6xl mx-auto mb-12">
        <div
          className="opacity-0 animate-slide-up delay-100 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-800"
          onClick={() => navigate("/appointment-assist")}
        >
          <div className="p-8 text-white">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar size={48} />
              </div>
              <h2 className="text-3xl font-bold ml-6">Schedule Appointment</h2>
            </div>
            <p className="text-white/90 text-xl leading-relaxed max-w-2xl">
              Book and manage appointments with our intelligent scheduling
              system. Get instant confirmations and reminders for your medical
              consultations.
            </p>
            <button className="mt-6 bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-200">
              Book Now
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card
          title="Patient Info"
          icon={<User size={40} />}
          color="bg-gradient-to-br from-emerald-400 to-emerald-600"
          description="Access and manage comprehensive patient records with our advanced electronic health record system."
          onClick={() => navigate("/Patients")}
          delay="delay-200"
        />
        <Card
          title="Bed Management"
          icon={<Bed size={40} />}
          color="bg-gradient-to-br from-amber-400 to-amber-600"
          description="Real-time bed availability tracking and smart allocation system for optimal resource utilization."
          onClick={() => navigate("/beds")}
          delay="delay-300"
        />
        <Card
          title="Inventory Control"
          icon={<Package size={40} />}
          color="bg-gradient-to-br from-violet-400 to-violet-600"
          description="Smart inventory tracking with automated alerts and predictive analytics for supply management."
          onClick={() => navigate("/Hospital_Inventory")}
          delay="delay-400"
        />
      </div>
    </main>
  );
};

const NavItem = ({ icon, text, to }) => (
  <Link
    to={to}
    className="text-gray-600 hover:text-blue-600 flex items-center transition-colors duration-200"
  >
    <span className="mr-2">{icon}</span>
    <span className="font-medium">{text}</span>
  </Link>
);

const MobileNavItem = ({ icon, text, to }) => (
  <Link
    to={to}
    className="text-gray-600 hover:text-blue-600 flex items-center p-3 rounded-lg transition-colors duration-200"
  >
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{text}</span>
  </Link>
);

const Card = ({ title, icon, color, description, onClick, delay }) => (
  <div
    className={`opacity-0 animate-slide-up ${delay} rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}
    onClick={onClick}
  >
    <div className={`${color} p-6 text-white h-full flex flex-col`}>
      <div className="flex items-center mb-4">
        <div className="p-3 bg-white/20 rounded-xl">{icon}</div>
        <h2 className="text-2xl font-bold ml-4">{title}</h2>
      </div>
      <p className="text-white/90 text-lg leading-relaxed">{description}</p>
    </div>
  </div>
);

// Keep your existing route components (BedAllot, Inven, AllPatients)
// In your HomePage component, find this section:
// Route Components
const BedAllot = () => (
  <div className="pt-20 container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-8 text-center">Bed Allotment</h1>
    <BedAssignment />
  </div>
);

const Inven = () => (
  <div className="pt-20 container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-8 text-center">Inventory Manager</h1>
    <HospitalInventoryManager />
  </div>
);

const AllPatients = () => (
  <div className="pt-20 container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-8 text-center">Patients Info</h1>
    <HospitalPatientsDisplay />
  </div>
);

// Add these styles to your CSS
const style = document.createElement("style");
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-slide-up {
    animation: slideUp 0.8s ease-out forwards;
  }

  .animate-fade-in {
    animation: fadeIn 1s ease-out forwards;
  }

  .delay-100 {
    animation-delay: 0.1s;
  }

  .delay-200 {
    animation-delay: 0.2s;
  }

  .delay-300 {
    animation-delay: 0.3s;
  }

  .delay-400 {
    animation-delay: 0.4s;
  }
`;
document.head.appendChild(style);

export default HomePage;
