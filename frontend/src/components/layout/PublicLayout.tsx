import { Outlet } from 'react-router-dom';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-3xl opacity-20"></div>

      <Outlet />
    </div>
  );
};
