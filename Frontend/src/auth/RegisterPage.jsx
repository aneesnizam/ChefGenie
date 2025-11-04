import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import axiosInstance from "../services/axios";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    age: "",
    isCook: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/register/", formData);
      console.log(res.data);
      navigate("/login");
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) {
        const errors = err.response.data;
        if (errors.email) {
          setErrorMessage("Email already exists. Please use a different email.");
        } else {
          setErrorMessage("Registration failed. Please check your details.");
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#ffecd1_0%,#fdf8f3_50%,#f4ede3_100%)] dark:bg-[linear-gradient(180deg,#1a1410_100%)] px-4">
      <div className="w-full max-w-md bg-card shadow-xl rounded-2xl p-8 border border-border">
        <h2 className="text-3xl font-bold text-center mb-6">
          Create an Account
        </h2>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Country */}
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          />

          {/* Age */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            min="0"
            required
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
          />

          {/* Cook Option */}
          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              name="isCook"
              checked={formData.isCook}
              onChange={handleChange}
              id="isCook"
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="isCook" className="text-foreground text-sm">
              I am a Cook (I want to add and share recipes)
            </label>
          </div>

          {/* Submit Button with Loading */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-6 flex justify-center items-center gap-2 rounded-lg font-semibold text-white transition-all
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "cursor-pointer bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>

          {/* Login Redirect */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer text-primary font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
