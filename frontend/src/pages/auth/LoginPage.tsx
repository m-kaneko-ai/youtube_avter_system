import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lightbulb, Video } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setGoogleError('');
    const success = await loginWithGoogle(response.credential);
    if (success) {
      navigate('/dashboard');
    } else {
      setGoogleError('Googleログインに失敗しました');
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 320,
          });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [GOOGLE_CLIENT_ID, handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  return (
    <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
      {/* Left Side: Brand & Visual */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={200} />
        </div>
        <div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Creator Studio AI</h1>
          <p className="text-blue-100">
            あなたの創造性を加速させる、
            <br />
            次世代の制作パートナー。
          </p>
        </div>
        <div className="space-y-4 mt-12 md:mt-0">
          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="bg-white text-blue-600 p-2 rounded-lg">
              <Lightbulb size={16} />
            </div>
            <div className="text-sm">
              <span className="font-bold">AI企画立案</span>{' '}
              <span className="opacity-70">- トレンド分析から</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
            <div className="bg-white text-blue-600 p-2 rounded-lg">
              <Video size={16} />
            </div>
            <div className="text-sm">
              <span className="font-bold">自動動画生成</span>{' '}
              <span className="opacity-70">- 台本から1クリックで</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          Welcome Back!
        </h2>

        {/* Google Sign In Button */}
        {GOOGLE_CLIENT_ID && (
          <div className="mb-6">
            <div id="google-signin-button" className="flex justify-center"></div>
            {googleError && (
              <p className="text-red-500 text-sm text-center mt-2">{googleError}</p>
            )}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400">または</span>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
              placeholder="hello@creator.ai"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>ログイン状態を保持</span>
            </label>
            <a href="#" className="text-blue-600 font-bold hover:underline">
              パスワードをお忘れですか？
            </a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl transform active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ログイン中...' : 'ダッシュボードへ移動'}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-500 mb-2">
            デモアカウント:
          </p>
          <div className="space-y-1 text-xs text-slate-600">
            <p>
              <span className="font-medium">ユーザー:</span> demo@example.com /
              demo123
            </p>
            <p>
              <span className="font-medium">管理者:</span> admin@example.com /
              admin123
            </p>
            <p>
              <span className="font-medium">クライアント:</span>{' '}
              client@example.com / client123
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          アカウントをお持ちではありませんか？{' '}
          <a href="#" className="text-blue-600 font-bold hover:underline">
            新規登録
          </a>
        </p>
      </div>
    </div>
  );
};
