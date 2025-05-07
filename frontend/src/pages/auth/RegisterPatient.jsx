import React, { useState, useEffect, useRef } from "react";
import axios from "axios"; // Use your configured axios instance
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../../styles/RegisterPatient.css";

const RegisterPatient = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    otp: Array(6).fill(""),
  });

  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");
  const [otpResendDisabled, setOtpResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const otpInputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (otpResendDisabled && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (resendTimer === 0) {
      setOtpResendDisabled(false);
      setResendTimer(30);
    }
    return () => clearTimeout(timer);
  }, [otpResendDisabled, resendTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...formData.otp];
    newOtp[index] = value.substring(value.length - 1);
    setFormData({ ...formData, otp: newOtp });

    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // First register the patient
      const response = await axios.post("/api/patient/register", {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
      });

      // Then send OTP
      await handleSendOtp();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to register patient. Please check the details.");
      toast.error(err.response?.data?.message || "Failed to register patient");
    }
  };

  const handleSendOtp = async () => {
    try {
      const response = await axios.post("/api/patient/send-otp", {
        contactNumber: formData.contactNumber,
      });
      
      toast.success("OTP sent successfully!");
      setShowOtp(true);
      setOtpResendDisabled(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send OTP");
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleResendOtp = async () => {
    try {
      await handleSendOtp();
      setOtpResendDisabled(true);
      setResendTimer(30);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resend OTP");
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = formData.otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter a 6-digit OTP");
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    try {
      const response = await axios.post("/api/patient/verify-otp", {
        contactNumber: formData.contactNumber,
        otp: otpString,
      });

      toast.success("Patient registered successfully!");
      setRegistrationSuccess(true);
      
      // Redirect to receptionist dashboard after 3 seconds
      setTimeout(() => {
        navigate("/receptionist/dashboard");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid or expired OTP");
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    }
  };

  if (registrationSuccess) {
    return (
      <div className="register-container">
        <div className="register-box success-box">
          <div className="success-icon">✓</div>
          <h2>Registration Successful!</h2>
          <p>Patient has been successfully registered.</p>
          <p>You can now proceed to book appointments.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register Patient</h2>
        <form onSubmit={showOtp ? handleVerifyOtp : handleRegister}>
          {!showOtp ? (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Enter 6-digit OTP</label>
                <div className="otp-container">
                  {formData.otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(ref) => (otpInputRefs.current[index] = ref)}
                      className="otp-input"
                      required
                    />
                  ))}
                </div>
                <div className="otp-actions">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpResendDisabled}
                    className="resend-btn"
                  >
                    {otpResendDisabled ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn-primary">
            {showOtp ? "Verify OTP" : "Register & Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPatient;