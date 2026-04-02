import { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function MethodistLogin() {
  const [step, setStep] = useState(1); // 1=email/pass, 2=verify code
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [result, setResult] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Step 1: Send verification code via Web3Forms
  const sendCode = async (e) => {
    e.preventDefault();
    setResult("");

    if (!formData.email || !formData.password) {
      setResult("Please fill email and password");
      return;
    }

    // generate 6-digit code
    const newCode = Math.floor(100000 + Math.random() * 900000);
    setGeneratedCode(newCode);

    const formDataWeb3 = new FormData();
    formDataWeb3.append("access_key", "713ac50e-d5c5-4e5e-97c7-3a8b18333896"); // your Web3Forms API key
    formDataWeb3.append("from_name", "Methodist Portal");
    formDataWeb3.append("from_email", "no-reply@methodistportal.com");
    formDataWeb3.append("to", formData.email);
    formDataWeb3.append("subject", "Your Verification Code");
    formDataWeb3.append(
      "message",
      `Your Methodist Portal verification code is: ${newCode}. It will expire in 5 minutes.`
    );

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataWeb3,
      });
      const data = await res.json();
      if (data.success) {
        setResult("Verification code sent! Check your email.");
        setStep(2);
      } else {
        setResult("Error sending verification code.");
      }
    } catch {
      setResult("Error sending verification code.");
    }
  };

  // Step 2: Verify code & create/login user
  const verifyCode = async (e) => {
    e.preventDefault();
    setResult("");

    if (parseInt(code) === generatedCode) {
      try {
        if (!isLogin) {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          setUser(userCredential.user);
          setResult("Account created successfully!");
        } else {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          setUser(userCredential.user);
          setResult("Logged in successfully!");
        }
        setStep(1);
        setCode("");
        setFormData({ email: "", password: "" });
        setGeneratedCode(null);
      } catch (err) {
        setResult(err.message);
      }
    } else {
      setResult("Invalid verification code.");
    }
  };

  const logout = () => {
    setUser(null);
    setResult("");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", fontFamily: "Arial" }}>
      {!user ? (
        <>
          <h2>{isLogin ? "Login" : "Register"}</h2>
          {result && <p style={{ color: result.includes("successfully") ? "green" : "red" }}>{result}</p>}

          {step === 1 ? (
            <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="submit">{isLogin ? "Send Code to Login" : "Send Code to Register"}</button>
            </form>
          ) : (
            <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <button type="submit">Verify Code</button>
            </form>
          )}

          <p onClick={() => { setIsLogin(!isLogin); setStep(1); setResult(""); }} style={{ cursor: "pointer", marginTop: "10px" }}>
            {isLogin ? "Register instead?" : "Login instead?"}
          </p>
        </>
      ) : (
        <>
          <h3>Welcome, {user.email}</h3>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}