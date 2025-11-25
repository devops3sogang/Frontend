// 회원가입 페이지

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/auth";
import "./Signup.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (nickname.trim().length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const signupData = {
        email,
        password,
        nickname: nickname.trim(),
      };
      console.log("회원가입 요청 데이터:", signupData);

      await signup(signupData);

      alert("회원가입이 완료되었습니다! 로그인해주세요.");
      navigate("/login");
    } catch (err: any) {
      console.error("Signup failed:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);

      // 백엔드에서 반환한 에러 메시지 확인
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error;

      if (
        err.response?.status === 409 ||
        errorMessage?.includes("already exists")
      ) {
        setError("이미 존재하는 이메일입니다.");
      } else if (err.response?.status === 400) {
        // 400 에러는 입력값 검증 실패
        setError(errorMessage || "입력한 정보를 확인해주세요.");
      } else if (err.response?.status === 500) {
        // 500 에러는 서버 내부 오류
        console.error("서버 내부 오류 - 백엔드 로그를 확인하세요");
        setError(
          errorMessage || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      } else {
        setError(
          errorMessage || "회원가입 중 오류가 발생했습니다. 다시 시도해주세요."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>회원가입</h1>
        <p className="signup-subtitle">서강대학교 맛집 리뷰</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sogang.ac.kr"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              required
              disabled={isLoading}
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력하세요"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="login-link">
          <p>
            이미 계정이 있으신가요?{" "}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              로그인
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
