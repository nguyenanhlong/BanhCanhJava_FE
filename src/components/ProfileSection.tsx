import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';
import { getUserTier, MEMBERSHIP_TIERS, formatVND, getVouchersForTier, claimVoucher } from '../services/membership';
import { User as UserIcon, Phone, Mail, MapPin, Lock, Save, X, Camera, Calendar, ShoppingBag, Award, Gift, Star, TrendingUp, Ticket } from 'lucide-react';

interface ProfileSectionProps {
  user: User;
  isBackendConnected: boolean;
  onUpdateUser?: (user: Partial<User>) => void;
  orderCount?: number;
}

export function ProfileSection({ user, isBackendConnected, onUpdateUser, orderCount = 0 }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: user.fullName || '', phone: user.phone || '', address: user.address || '', email: user.email || '', avatarUrl: user.avatarUrl || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [voucherMsg, setVoucherMsg] = useState('');
  const [profileVouchers, setProfileVouchers] = useState<any[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const profileTier = getUserTier(user.total_spent || 0, user.total_orders || 0);

  React.useEffect(() => {
    if (profileTier.voucherCount > 0) {
      const userIdNum = Number(user.id);
      if (isBackendConnected && !isNaN(userIdNum)) {
        getVouchersForTier(profileTier, userIdNum).then(setProfileVouchers).catch(() => {});
      } else {
        getVouchersForTier(profileTier).then(setProfileVouchers).catch(() => {});
      }
    }
  }, [user.id, profileTier.id, isBackendConnected]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      if (isBackendConnected) {
        const updated = await ApiService.updateUser(user.id, { fullName: form.fullName, phone: form.phone, address: form.address, email: form.email });
        if (onUpdateUser) onUpdateUser({ fullName: updated.fullName, phone: updated.phone, address: updated.address, email: updated.email, avatarUrl: updated.avatarUrl });
      } else {
        if (onUpdateUser) onUpdateUser(form);
      }
      setMsg({ type: 'success', text: 'Đã cập nhật thông tin thành công!' });
      setTimeout(() => setMsg(null), 3000);
      setEditing(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Lỗi khi cập nhật' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setMsg({ type: 'error', text: 'Mật khẩu mới không khớp!' }); return; }
    if (pwForm.newPassword.length < 6) { setMsg({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự!' }); return; }
    setSaving(true); setMsg(null);
    try {
      if (isBackendConnected) await ApiService.changePassword(user.id, pwForm.oldPassword, pwForm.newPassword);
      setMsg({ type: 'success', text: 'Đã đổi mật khẩu thành công!' });
      setTimeout(() => setMsg(null), 3000);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); setShowPwForm(false);
    } catch (err: any) { setMsg({ type: 'error', text: err.message || 'Lỗi khi đổi mật khẩu' }); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full text-xs p-3 rounded-xl border border-[#E5E1D8] dark:border-[#3D302D] bg-white dark:bg-[#1C1311] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all duration-200 placeholder:text-[#B2A496]";
  const labelClass = "text-[10px] font-bold text-[#8B7E74] dark:text-[#B2A496] uppercase tracking-wider mb-1.5 flex items-center gap-1.5";
  const statCardClass = "bg-[#FAF8F5] dark:bg-[#150F0D] rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] p-4 text-center";
  const initial = (user.fullName || user.username).charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* COVER + AVATAR BANNER */}
      <div className="relative bg-gradient-to-br from-[#D97706]/20 via-[#D97706]/10 to-[#FAF8F5] dark:from-[#D97706]/10 dark:via-[#1C1311] dark:to-[#150F0D] rounded-3xl border border-[#E5E1D8] dark:border-[#2D2321] overflow-hidden">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#D97706]/30 to-amber-100/50 dark:from-[#D97706]/20 dark:to-[#2D2321]" />
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-[#1C1311] bg-[#D97706] flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-lg shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              {editing && (
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D97706] border-2 border-white dark:border-[#1C1311] flex items-center justify-center cursor-pointer hover:bg-[#D97706]/90 transition-colors shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="text" value={form.avatarUrl} onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))} className="hidden" />
                </label>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0 mt-2 sm:mt-0">
              {editing ? (
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Họ và tên" className="text-lg sm:text-xl font-bold bg-transparent border-b-2 border-[#D97706] text-[#2D241E] dark:text-[#FAF8F5] focus:outline-none w-full sm:w-auto placeholder:text-[#B2A496]" />
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#2D241E] dark:text-[#FAF8F5]">{user.fullName || user.username}</h2>
                  <p className="text-xs text-[#8B7E74] mt-0.5">@{user.username}</p>
                </>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="bg-[#D97706] hover:bg-[#D97706]/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> Chỉnh Sửa
                </button>
              ) : (
                <>
                  <button onClick={() => { setEditing(false); setForm({ fullName: user.fullName || '', phone: user.phone || '', address: user.address || '', email: user.email || '', avatarUrl: user.avatarUrl || '' }); }} className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] transition-colors cursor-pointer flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                  <button onClick={handleSave} disabled={saving} className="bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold shadow-sm border animate-slideDown ${
          msg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/40'
        }`}>
          <span className={`text-lg ${msg.type === 'success' ? '' : ''}`}>{msg.type === 'success' ? '✅' : '❌'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-3">
        <div className={statCardClass}>
          <ShoppingBag className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
          <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{orderCount}</p>
          <p className="text-[9px] text-[#8B7E74] uppercase font-bold tracking-wider">Đơn hàng</p>
        </div>
        <div className={statCardClass}>
          <Award className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
          <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{getUserTier(user.total_spent || 0, user.total_orders || 0).displayName}</p>
          <p className="text-[9px] text-[#8B7E74] uppercase font-bold tracking-wider">Hạng thành viên</p>
        </div>
        <div className={statCardClass}>
          <Calendar className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
          <p className="text-lg font-black text-[#2D241E] dark:text-[#FAF8F5]">{new Date().getFullYear()}</p>
          <p className="text-[9px] text-[#8B7E74] uppercase font-bold tracking-wider">Năm tham gia</p>
        </div>
      </div>

      {/* THÔNG TIN CÁ NHÂN */}
      <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5]/50 dark:bg-[#150F0D]/50 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Thông Tin Cá Nhân</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}><UserIcon className="w-3 h-3" /> Họ Và Tên</label>
              {editing ? (
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Nguyễn Văn A" className={inputClass} />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321]">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-sm shrink-0"><UserIcon className="w-4 h-4 text-[#D97706]" /></div>
                  <div>
                    <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5]">{user.fullName || <span className="italic text-[#B2A496] font-normal">Chưa cập nhật</span>}</p>
                    <p className="text-[9px] text-[#8B7E74]">Tên hiển thị của bạn</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}><Mail className="w-3 h-3" /> Email</label>
              {editing ? (
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className={inputClass + (form.email !== user.email ? ' border-[#D97706]' : '')} />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321]">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-sm shrink-0"><Mail className="w-4 h-4 text-[#D97706]" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5] truncate">{user.email}</p>
                    <p className="text-[9px] text-[#8B7E74]">Địa chỉ email đăng ký</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}><Phone className="w-3 h-3" /> Số Điện Thoại</label>
              {editing ? (
                <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="0912 345 678" className={inputClass} />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321]">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-sm shrink-0"><Phone className="w-4 h-4 text-[#D97706]" /></div>
                  <div>
                    <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5]">{user.phone || <span className="italic text-[#B2A496] font-normal">Chưa cập nhật</span>}</p>
                    <p className="text-[9px] text-[#8B7E74]">Liên hệ khi giao hàng</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}><MapPin className="w-3 h-3" /> Địa Chỉ Giao Hàng</label>
              {editing ? (
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Số nhà, đường, phường/xã..." className={inputClass + " resize-none"} rows={2} />
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321]">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-sm shrink-0 mt-0.5"><MapPin className="w-4 h-4 text-[#D97706]" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2D241E] dark:text-[#FAF8F5]">{user.address || <span className="italic text-[#B2A496] font-normal">Chưa cập nhật</span>}</p>
                    <p className="text-[9px] text-[#8B7E74]">Địa chỉ mặc định</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div>
              <label className={labelClass}><Camera className="w-3 h-3" /> Ảnh Đại Diện (URL)</label>
              <input type="text" value={form.avatarUrl} onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))} placeholder="https://example.com/avatar.jpg" className={inputClass} />
            </div>
          )}
        </div>
      </div>

      {/* HẠNG THÀNH VIÊN */}
      <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5]/50 dark:bg-[#150F0D]/50 flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Ưu Đãi Hạng Thành Viên</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MEMBERSHIP_TIERS.map(tier => {
              const isCurrentTier = getUserTier(user.total_spent || 0, user.total_orders || 0).id === tier.id;
              const isUnlocked = tier.id <= getUserTier(user.total_spent || 0, user.total_orders || 0).id;
              return (
                <div key={tier.id} className={`relative p-4 rounded-xl border text-center transition-all ${
                  isCurrentTier
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 border-[#D97706] ring-1 ring-[#D97706]/30'
                    : isUnlocked
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30'
                    : 'bg-[#FAF8F5] dark:bg-[#150F0D] border-[#E5E1D8] dark:border-[#2D2321] opacity-60'
                }`}>
                  {isCurrentTier && (
                    <span className="absolute -top-2 -right-2 bg-[#D97706] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Hiện tại
                    </span>
                  )}
                  <div className={`text-3xl mb-2 ${tier.name === 'vip' ? '' : tier.name === 'loyal' ? '' : ''}`}>
                    {tier.name === 'vip' ? '👑' : tier.name === 'loyal' ? '⭐' : '🌱'}
                  </div>
                  <h4 className="font-black text-sm text-[#2D241E] dark:text-[#FAF8F5]">{tier.displayName}</h4>
                  <p className="text-[9px] text-[#8B7E74] mt-1 leading-relaxed">
                    {tier.name === 'member' ? 'Hạng cơ bản cho mọi khách hàng' :
                     tier.name === 'loyal' ? `Từ ${formatVND(tier.minTotalSpent)} & ${tier.minTotalOrders} đơn` :
                     `Từ ${formatVND(tier.minTotalSpent)} & ${tier.minTotalOrders} đơn`}
                  </p>
                  {tier.autoDiscountPercent > 0 && (
                    <p className="mt-2 text-xs font-bold text-[#D97706]">Giảm {tier.autoDiscountPercent}% hóa đơn</p>
                  )}
                  {tier.voucherCount > 0 && (
                    <p className="text-[10px] text-[#3E2F26] dark:text-[#EAE3D2] mt-0.5">
                      + {tier.voucherCount} voucher giảm {tier.voucherDiscountPercent}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Voucher claim section */}
          {profileTier.voucherCount > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#D97706]" />
                  <h4 className="font-bold text-xs text-[#2D241E] dark:text-[#FAF8F5]">Voucher {profileTier.displayName}</h4>
                </div>
                <span className="text-[10px] text-[#8B7E74] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
                  {profileVouchers.filter(v => !v.usedAt && new Date(v.expiredAt) > new Date()).length}/{profileTier.voucherCount} còn lại
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileVouchers.filter(v => !v.usedAt && new Date(v.expiredAt) > new Date()).map(v => (
                  <div key={v.id} className="flex items-center gap-2 bg-white dark:bg-[#1C1311] px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <span className="text-xs font-bold text-[#D97706]">{v.discountPercent}%</span>
                    <span className="text-[8px] font-mono text-[#8B7E74] max-w-[100px] truncate">{v.code}</span>
                    <span className="text-[8px] font-mono text-[#8B7E74]">HSD: {new Date(v.expiredAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                ))}
                {profileTier.voucherCount > profileVouchers.length && (
                  <button onClick={async () => {
                    setClaiming(true);
                    try {
                      const userIdNum = Number(user.id);
                      const v = await claimVoucher(profileTier, isBackendConnected && !isNaN(userIdNum) ? userIdNum : undefined);
                      if (v) {
                        setVoucherMsg(`Đã nhận voucher ${v.discountPercent}% - Mã: ${v.code}`);
                        setTimeout(() => setVoucherMsg(''), 4000);
                        const userIdNum2 = Number(user.id);
                        const fresh = await getVouchersForTier(profileTier, isBackendConnected && !isNaN(userIdNum2) ? userIdNum2 : undefined);
                        setProfileVouchers(fresh);
                      }
                    } finally {
                      setClaiming(false);
                    }
                  }}
                    disabled={claiming}
                    className="px-3 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#D97706]/90 disabled:bg-[#8B7E74]/50 text-white text-[10px] font-bold cursor-pointer transition-all">
                    {claiming ? 'Đang nhận...' : '+ Nhận voucher'}
                  </button>
                )}
              </div>
              {voucherMsg && <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{voucherMsg}</p>}
            </div>
          )}

          {user.role !== 'admin' && user.role !== 'super_admin' && (
            <div className="mt-4 p-3 bg-[#FAF8F5] dark:bg-[#150F0D] rounded-xl border border-[#E5E1D8] dark:border-[#2D2321] text-[10px] text-[#8B7E74] flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>Đặt hàng thường xuyên để nâng hạng thành viên và nhận nhiều ưu đãi hơn!</span>
            </div>
          )}
        </div>
      </div>

      {/* BẢO MẬT */}
      <div className="bg-white dark:bg-[#1C1311] rounded-2xl border border-[#E5E1D8] dark:border-[#2D2321] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E1D8] dark:border-[#2D2321] bg-[#FAF8F5]/50 dark:bg-[#150F0D]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-bold text-sm text-[#2D241E] dark:text-[#FAF8F5]">Bảo Mật</h3>
          </div>
          {!showPwForm && (
            <button onClick={() => setShowPwForm(true)} className="text-[10px] bg-[#D97706] hover:bg-[#D97706]/90 text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1">
              <Lock className="w-3 h-3" /> Đổi Mật Khẩu
            </button>
          )}
        </div>
        <div className="p-6">
          {!showPwForm ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#150F0D] border border-[#E5E1D8] dark:border-[#2D2321] text-xs text-[#8B7E74]">
              <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Mật khẩu của bạn được bảo vệ an toàn. Nên đổi mật khẩu định kỳ để tăng cường bảo mật.</span>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className={labelClass}>Mật Khẩu Hiện Tại</label>
                <input type="password" required value={pwForm.oldPassword} onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} placeholder="••••••••" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Mật Khẩu Mới</label>
                  <input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Tối thiểu 6 ký tự" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Xác Nhận Lại</label>
                  <input type="password" required minLength={6} value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Nhập lại mật khẩu mới" className={`${inputClass} ${pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'ring-2 ring-red-400 border-red-400' : ''}`} />
                </div>
              </div>
              {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">Mật khẩu không khớp</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPwForm(false); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-5 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#3D302D] text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] transition-colors cursor-pointer">Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> {saving ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
