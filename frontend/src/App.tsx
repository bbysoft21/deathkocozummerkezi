import React, { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { Dashboard } from './Dashboard';
import axios from 'axios';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 Saat (60 Dakika)

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  const performLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_time');
    setUser(null);
  };

  const checkSessionExpiration = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    const loginTimeStr = localStorage.getItem('login_time');

    if (!storedUser || !storedToken) {
      performLogout();
      return false;
    }

    if (loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10);
      const now = Date.now();
      if (now - loginTime >= SESSION_DURATION_MS) {
        // 1 saati tamamlandı, oturumu sonlandırıp kullanıcı adı/şifre ekranına yönlendir
        performLogout();
        return false;
      }
    } else {
      localStorage.setItem('login_time', Date.now().toString());
    }

    return true;
  };

  useEffect(() => {
    const isValid = checkSessionExpiration();
    if (isValid) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          performLogout();
        }
      }
    }

    // Her 15 saniyede bir 1 saatlik oturum süresini arka planda kontrol et
    const interval = setInterval(() => {
      checkSessionExpiration();
    }, 15000);

    // Global Axios Interceptor: 401 Unauthorized durumunda veya jeton dolduğunda otomatik çıkış yap
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          performLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      clearInterval(interval);
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogout = () => {
    performLogout();
  };

  return (
    <div>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={(loggedInUser) => {
          localStorage.setItem('login_time', Date.now().toString());
          setUser(loggedInUser);
        }} />
      )}
    </div>
  );
};
