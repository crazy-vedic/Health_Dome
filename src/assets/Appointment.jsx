import React, { useState, useRef, useEffect } from "react";
import { Send, Clock, Calendar, MapPin, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const SEVERITY_COLORS = {
  RED: "bg-red-500",
  ORANGE: "bg-orange-500",
  YELLOW: "bg-yellow-500",
  BLUE: "bg-blue-500",
  GREEN: "bg-green-500",
};

const SEVERITY_LABELS = {
  RED: "Immediate attention required",
  ORANGE: "Urgent - Within 24 hours",
  YELLOW: "Schedule soon",
  BLUE: "Minor issue",
  GREEN: "No immediate attention needed",
};

const CustomCalendar = ({ severity, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get severity level and recommended days offset
  const getSeverityOffset = (severity) => {
    switch (severity) {
      case "RED":
        return 0; // Today
      case "ORANGE":
        return 1; // Tomorrow
      case "YELLOW":
        return 2; // Day after tomorrow
      case "BLUE":
        return 3; // 3 days from now
      case "GREEN":
        return 4; // 4 days from now
      default:
        return 0;
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Get date severity color
  const getDateSeverity = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    const offset = getSeverityOffset(severity);

    if (diffDays < 0) return "bg-gray-100 text-gray-400";
    if (diffDays === offset) return SEVERITY_COLORS[severity];
    return "bg-white hover:bg-gray-50";
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateSelect) onDateSelect(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const severityClass = getDateSeverity(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
            ${severityClass}
            ${isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""}
            ${isToday ? "font-bold" : ""}
          `}
          disabled={date < new Date()}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.setMonth(currentDate.getMonth() - 1))
            )
          }
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-medium">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          onClick={() =>
            setCurrentDate(
              new Date(currentDate.setMonth(currentDate.getMonth() + 1))
            )
          }
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      {/* Severity Legend */}
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-gray-600">Recommended Timing:</p>
        <div className="flex items-center space-x-2">
          <div
            className={`w-4 h-4 rounded-full ${SEVERITY_COLORS[severity]}`}
          />
          <span className="text-sm text-gray-600">
            {SEVERITY_LABELS[severity]}
          </span>
        </div>
      </div>
    </div>
  );
};

const AppointmentAssist = () => {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hello! Please describe your symptoms in detail so I can help you book an appropriate appointment.",
    },
  ]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [severity, setSeverity] = useState("YELLOW");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectSeverity = (text) => {
    const textUpper = text.toUpperCase();
    if (textUpper.includes("RED") || textUpper.includes("IMMEDIATE") || textUpper.includes("EMERGENCY")) {
      return "RED";
    } else if (textUpper.includes("ORANGE") || textUpper.includes("URGENT")) {
      return "ORANGE";
    } else if (textUpper.includes("YELLOW") || textUpper.includes("SOON")) {
      return "YELLOW";
    } else if (textUpper.includes("BLUE") || textUpper.includes("MINOR")) {
      return "BLUE";
    } else if (textUpper.includes("GREEN") || textUpper.includes("ROUTINE")) {
      return "GREEN";
    }
    return "YELLOW"; // default severity
  };

  const fetchDiagnosis = async (symptoms) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      const data = await response.json();
      if (data && data.assessment) {
        // Extract severity by searching through the response text
        const detectedSeverity = detectSeverity(JSON.stringify(data.assessment));
        setSeverity(detectedSeverity);
        return data.assessment;
      }
      throw new Error("No assessment data available");
    } catch (error) {
      console.error(error);
      setSeverity("YELLOW"); // Default severity
      return {
        diagnosis: "Error",
        severity: "Error",
        recommendations: "Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", content: input }]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const result = await fetchDiagnosis(userInput);
      setDiagnosis(result);
      // Update messages with severity information
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: `Based on your symptoms, here's my assessment:\n\nUrgency: ${SEVERITY_LABELS[severity]}\n${result}\n\nWould you like to book an appointment?`,
        },
      ]);
      setShowBooking(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "I apologize, but I encountered an error analyzing your symptoms. Please try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        content: `You've selected ${date.toLocaleDateString()}. Please select a time slot to proceed.`,
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 h-screen bg-gray-50 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pt-8">
        {/* Chat Section */}
        <div className="md:col-span-2 flex flex-col h-[85vh] bg-white rounded-xl shadow-lg">
          <div className="border-b p-4 bg-white rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-800">
              Medical Assistant
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm animate-fade-in ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 p-4 bg-white rounded-2xl w-fit animate-pulse border border-gray-100">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm text-gray-500">
                  Processing your symptoms...
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t bg-white rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Booking Section */}
        {showBooking && diagnosis && (
          <div className="bg-white rounded-xl shadow-lg h-fit animate-fade-in">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Book Appointment
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Select Date
                  </label>
                  <CustomCalendar
                    severity={severity}
                    onDateSelect={handleDateSelect}
                  />
                </div>

                {selectedDate && (
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">
                        Select Time
                      </label>
                      <div className="flex items-center border border-gray-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <Clock size={20} className="text-gray-400 mr-3" />
                        <input
                          type="time"
                          className="flex-1 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">
                        Select Location
                      </label>
                      <div className="flex items-center border border-gray-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <MapPin size={20} className="text-gray-400 mr-3" />
                        <select className="flex-1 focus:outline-none bg-transparent">
                          <option>Mohalla Clinic - Sector 1</option>
                          <option>Mohalla Clinic - Sector 15</option>
                          <option>City Hospital</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium mt-4"
                    >
                      Confirm Appointment
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentAssist;
