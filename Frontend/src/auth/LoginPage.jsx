import { useState } from "react";
import { Loader2 } from "lucide-react";
import axiosInstance from "../services/axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/login/", formData);
      localStorage.setItem("tokens", JSON.stringify(res.data));
      navigate("/app/home/");
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 401) {
        setErrorMessage("Invalid email or password.");
      } else if (err.response && err.response.status === 400) {
        setErrorMessage("Please fill in all fields correctly.");
      } else {
        setErrorMessage("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#ffecd1_0%,#fdf8f3_50%,#f4ede3_100%)] dark:bg-[linear-gradient(180deg,#1a1410_100%)] px-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border">
        <h2 className="text-3xl font-bold mb-6 text-center text-foreground">
          Login to Your Account
        </h2>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
            />
          </div>

          {/* Submit Button with Loading */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-4 flex justify-center items-center gap-2 rounded-lg font-semibold text-white transition-all
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          {/* Register Redirect */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-primary font-semibold hover:underline"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}
