import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, UserCheck, Wifi, WifiOff } from 'lucide-react';
import { ApiService } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id: string; username: string; email: string; role: 'customer' | 'admin' | 'driver' }) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isRegisterStep, setIsRegisterStep] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin' | 'driver'>('customer');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [checkingConn, setCheckingConn] = useState(true);

  const triggerConnectionCheck = async () => {
    setCheckingConn(true);
    setErrorMsg('');
    try {
      const isOnline = await ApiService.checkConnection();
      setIsBackendConnected(isOnline);
      if (isOnline) {
        setSuccessMsg('Kết nối thành công tới Spring Boot & XAMPP MySQL Database!');
      } else {
        setErrorMsg('Không thể kết nối đến Spring Boot (localhost:8080). Hãy chắc chắn bạn đã chạy server Spring Boot!');
      }
    } catch {
      setIsBackendConnected(false);
      setErrorMsg('Lỗi khi kiểm tra kết nối localhost:8080.');
    } finally {
      setCheckingConn(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const checkConn = async () => {
      setCheckingConn(true);
      try {
        const isOnline = await ApiService.checkConnection();
        if (active) {
          setIsBackendConnected(isOnline);
        }
      } catch {
        if (active) {
          setIsBackendConnected(false);
        }
      } finally {
        if (active) {
          setCheckingConn(false);
        }
      }
    };
    checkConn();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin tài khoản!');
      return;
    }

    if (isBackendConnected) {
      // -------------------------------------------------------------
      // CHẾ ĐỘ THẬT: CHỈ KẾT NỐI VÀ LƯU TRÊN SPRING BOOT MYSQL (XAMPP / LOCALHOST)
      // -------------------------------------------------------------
      try {
        if (isRegisterStep) {
          if (!email.trim()) {
            setErrorMsg('Vui lòng cung cấp địa chỉ email!');
            return;
          }
          const payload = {
            username: trimmedUsername,
            password: trimmedPassword,
            email: email.trim(),
            role: 'customer'
          };
          
          await ApiService.register(payload);
          setSuccessMsg(`Đăng ký tài khoản Khách hàng [${trimmedUsername}] lên MySQL (XAMPP) thành công! Bạn có thể sử dụng chính tài khoản này để Đăng nhập.`);
          setIsRegisterStep(false);
          return;
        } else {
          // Live login
          const payload = { username: trimmedUsername, password: trimmedPassword };
          const response = await ApiService.login(payload);
          
          if (response && response.id) {
            const u = {
              id: String(response.id),
              username: response.username,
              email: response.email,
              role: response.role as 'customer' | 'admin' | 'driver'
            };
            onLoginSuccess(u);
            onClose();
            return;
          } else {
            setErrorMsg('Đăng nhập thất bại: Không lấy được thông tin người dùng hợp lệ từ Spring Boot!');
          }
        }
      } catch (err: any) {
        console.error('MySQL Auth Error:', err);
        // Expose Backend validator feedback directly to user
        const msg = err.message || '';
        if (msg) {
          setErrorMsg(`[SPRING BOOT MYSQL ERROR] ${msg}`);
        } else {
          setErrorMsg('Lỗi truy cập cơ sở dữ liệu MySQL thông qua Spring Boot! Hãy chắc chắn server localhost:8080 đang chạy.');
        }
      }
    } else {
      // -------------------------------------------------------------
      // CHẾ ĐỘ GIẢ LẬP: LƯU TRỮ VỀ LOCALSTORAGE CỦA TRÌNH DUYỆT
      // -------------------------------------------------------------
      const savedUsersStr = localStorage.getItem('banhcanh_registered_users');
      const registeredUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];

      if (isRegisterStep) {
        if (!email.trim()) {
          setErrorMsg('Vui lòng cung cấp địa chỉ email!');
          return;
        }

        // Check if username or email already exists
        const usernameExists = registeredUsers.some(
          (u: any) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
        );
        const emailExists = registeredUsers.some(
          (u: any) => u.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (usernameExists) {
          setErrorMsg('Tên đăng nhập đã tồn tại trong bộ lưu trữ giả lập!');
          return;
        }
        if (emailExists) {
          setErrorMsg('Địa chỉ Email đã được đăng ký tài khoản giả lập!');
          return;
        }

        // Add new simulated registered user
        const newUser = {
          id: 'cust-' + Date.now(),
          username: trimmedUsername,
          email: email.trim(),
          password: trimmedPassword,
          role: 'customer' as const
        };

        registeredUsers.push(newUser);
        localStorage.setItem('banhcanh_registered_users', JSON.stringify(registeredUsers));

        setSuccessMsg(`Đăng ký thành công tài khoản Khách hàng giả lập [${trimmedUsername}] vào LocalStorage máy!`);
        
        // Keep credentials populated for quick login
        setIsRegisterStep(false);
      } else {
        // Mock Login
        // 1. Check direct hardcoded admin/driver first
        if (trimmedUsername === 'admin' && trimmedPassword === 'admin') {
          const u = { id: 'admin-user', username: 'Chủ Quán (admin)', email: 'admin@banhcanhcaloc.com', role: 'admin' as const };
          onLoginSuccess(u);
          onClose();
          return;
        }
        if (trimmedUsername === 'driver' && trimmedPassword === 'driver') {
          const u = { id: 'driver-user', username: 'Tài xế Nguyễn Hải', email: 'haiship@gmail.com', role: 'driver' as const };
          onLoginSuccess(u);
          onClose();
          return;
        }

        // 2. Check local simulated registered users list
        const matchedUser = registeredUsers.find(
          (u: any) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
        );

        if (matchedUser) {
          if (matchedUser.password === trimmedPassword) {
            const u = {
              id: matchedUser.id,
              username: matchedUser.username,
              email: matchedUser.email,
              role: matchedUser.role
            };
            onLoginSuccess(u);
            onClose();
          } else {
            setErrorMsg('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
          }
          return;
        }

        setErrorMsg('Tài khoản không tồn tại hoặc sai thông tin mật khẩu! Hãy chắc chắn bạn đã "Đăng ký" trước nếu dùng tài khoản mới.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D241E]/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#FAF8F5] dark:bg-[#150F0D] text-[#3E2F26] dark:text-[#EAE3D2] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-2xl max-w-sm w-full overflow-hidden z-10 font-sans p-6 sm:p-8 transition-colors duration-300">
        
        {/* Header Close info */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-bold text-[#2D241E] dark:text-[#FAF8F5]">
            {isRegisterStep ? 'Đăng Ký Thành Viên' : 'Đăng Nhập Tài Khoản'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] text-[#8B7E74] dark:text-[#B2A496] hover:text-[#2D241E] dark:hover:text-[#FAF8F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONNECTION LAYER CLARITY BAR */}
        <div className={`mb-4 px-3 py-2.5 rounded-xl text-[10px] leading-relaxed font-sans border flex flex-col gap-1.5 transition-all duration-300 ${
          isBackendConnected 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400' 
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-950/40 text-amber-800 dark:text-amber-400'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              {isBackendConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>CHẾ ĐỘ MYSQL (SPRING BOOT ĐANG ONLINE)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>CHẾ ĐỘ GIẢ LẬP (KHÔNG THẤY SPRING BOOT CHẠY)</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={triggerConnectionCheck}
              disabled={checkingConn}
              className="text-[9px] px-1.5 py-0.5 rounded bg-[#2D241E] hover:bg-[#3E2F26] text-white dark:bg-[#FAF8F5] dark:text-[#2D241E] cursor-pointer font-sans select-none disabled:opacity-50"
            >
              {checkingConn ? 'Đang ping...' : 'Kiểm tra lại'}
            </button>
          </div>
          <p className="text-[9px] opacity-90">
            {isBackendConnected 
              ? 'Hành động đăng ký/đăng nhập của bạn sẽ trực tiếp tương tác và lưu vào bảng SQL thông qua Spring Boot.' 
              : 'Dễ dàng chạy thử offline. Khách hàng bắt buộc phải ĐĂNG KÝ trước mới có thể đăng nhập.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase mb-1">Tên Đăng Nhập / Email:</label>
            <input
              type="text"
              placeholder={isRegisterStep ? 'NghiaBanhCanh' : 'Nhập admin, driver hoặc tên bất kỳ'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              required
            />
          </div>

          {isRegisterStep && (
            <div>
              <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase mb-1">Địa chỉ Email:</label>
              <input
                type="email"
                placeholder="sales@banhcanhcaloc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase mb-1">Mật Khẩu:</label>
            <input
              type="password"
              placeholder={isRegisterStep ? '••••••••' : 'Nhập mật khẩu (admin/driver hoặc tùy ý)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-[#D97706]"
              required
            />
          </div>

          {/* Role selection representing role to Register / Login with */}
          {!isRegisterStep ? (
            <div>
              <label className="block text-[10px] font-bold text-[#3E2F26] dark:text-[#EAE3D2] uppercase mb-2">
                Vai trò đăng nhập nhanh (Trải nghiệm):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1311] text-[#3E2F26] dark:text-[#EAE3D2] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18]'
                  }`}
                >
                  Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                      : 'bg-white dark:bg-[#1C1311] text-[#3E2F26] dark:text-[#EAE3D2] border-[#E5E1D8] dark:border-[#2D2321] hover:bg-[#F3F0E9] dark:hover:bg-[#251A18]'
                  }`}
                >
                  Chủ quán (Admin)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#FAF8F5] dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] text-xs font-medium text-[#8B7E74] dark:text-[#B2A496] rounded-xl">
              Đăng ký tài khoản tự động lưu trữ làm <strong className="text-[#D97706] dark:text-amber-400">Khách hàng</strong> thành viên.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#D97706] hover:bg-[#D97706]/90 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isRegisterStep ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP HỆ THỐNG'}</span>
          </button>
        </form>

        {/* Toggle steps */}
        <div className="border-t border-[#E5E1D8] dark:border-[#2D2321] mt-6 pt-4 text-center">
          <button
            onClick={() => {
              setIsRegisterStep(!isRegisterStep);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs font-bold text-[#D97706] hover:underline"
          >
            {isRegisterStep 
              ? 'Đã là thành viên? Đăng nhập ngay' 
              : 'Trở thành thành viên mới? Đăng ký ngay'}
          </button>

          {/* Helper Tips block */}
          <div className="mt-4 p-2.5 bg-[#F3F0E9] dark:bg-[#211715] rounded-xl text-[9px] text-[#8B7E74] dark:text-[#B2A496] leading-normal text-left">
            <strong>Mẹo trải nghiệm nhanh:</strong><br />
            • Đăng nhập <strong>Chủ quán:</strong> gõ <code className="font-mono text-[#D97706]">admin</code> làm tên đăng nhập và mật khẩu.<br />
            • Đăng nhập <strong>Tài xế:</strong> gõ <code className="font-mono text-[#D97706]">driver</code> làm tên đăng nhập và mật khẩu.
          </div>
        </div>

      </div>
    </div>
  );
}
