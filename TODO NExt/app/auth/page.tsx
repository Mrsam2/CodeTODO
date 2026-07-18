'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Row } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import Lottie from 'lottie-react';
import timeAnimation from '@/public/Time.json';

const EyeIcon = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);

type AuthState = 'login' | 'signup' | 'forgot' | 'reset';

export default function AuthPage() {
  const store = useAppStore();

  const [authState, setAuthState] = useState<AuthState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google OAuth states
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // PWA Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // If iOS and not installed, automatically show popup after 2.5 seconds
    if (ios) {
      const timer = setTimeout(() => {
        setShowInstallPopup(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // For other browsers, capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatically show install card after 2.5 seconds
      setTimeout(() => {
        setShowInstallPopup(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstallPopup(false);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPopup(false);
  };

  const handleStateChange = (state: AuthState) => {
    setAuthState(state);
    setError(null);
    setSuccess(null);
    setPassword('');
    setOtp('');
    setSecurePassword(true);
  };

  const handleGoogleClick = () => {
    setError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file. Falling back to Mock Chooser.");
      setShowGoogleChooser(true);
      return;
    }

    const redirectUri = window.location.origin + '/auth';
    const scope = 'email profile openid';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      'google-signin',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      setError('Popup blocker blocked the sign-in window. Please enable popups.');
      return;
    }

    popup.focus();

    const interval = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          return;
        }

        const currentUrl = popup.location.href;
        if (currentUrl.startsWith(redirectUri)) {
          clearInterval(interval);
          const hash = popup.location.hash;
          popup.close();

          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            setLoading(true);
            try {
              const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
              const profile = await res.json();
              if (profile.email) {
                const err = await store.googleLogin('', true, profile.email, profile.name || profile.given_name || '');
                if (err) setError(err);
                else store.updateSettings({ onboardingComplete: true });
              } else {
                setError('Could not fetch user profile details from Google.');
              }
            } catch (err) {
              setError('Failed to fetch user info from Google: ' + (err as Error).message);
            } finally {
              setLoading(false);
            }
          } else {
            setError('Google sign-in token was not found in response.');
          }
        }
      } catch (e) {
        // Cross-origin exception is expected until redirected to redirectUri
      }
    }, 500);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (authState !== 'forgot') {
      if (authState === 'reset' && !otp.trim()) {
        setError('Please enter the 6-digit OTP code');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
    }

    setLoading(true);

    try {
      if (authState === 'login') {
        const errMessage = await store.login(email.trim(), password.trim());
        if (!errMessage) {
          store.updateSettings({ onboardingComplete: true });
        } else {
          setError(errMessage);
        }
      } else if (authState === 'signup') {
        const errMessage = await store.signup(email.trim(), password.trim());
        if (errMessage) {
          setError(errMessage);
        }
      } else if (authState === 'forgot') {
        const errMessage = await store.requestPasswordResetOtp(email.trim());
        if (!errMessage) {
          setSuccess('An OTP code has been sent to your email.');
          setTimeout(() => {
            handleStateChange('reset');
          }, 1500);
        } else {
          setError(errMessage);
        }
      } else if (authState === 'reset') {
        const errMessage = await store.resetPassword(email.trim(), otp.trim(), password.trim());
        if (!errMessage) {
          setSuccess('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            handleStateChange('login');
          }, 2000);
        } else {
          setError(errMessage);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            width: 280,
            height: 220,
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Lottie animationData={timeAnimation} loop={true} style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800, color: 'var(--color-text)' }}>
            {authState === 'login' && 'Welcome back!'}
            {authState === 'signup' && 'Create your account'}
            {authState === 'forgot' && 'Forgot Password'}
            {authState === 'reset' && 'Reset Password'}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {authState === 'login' && 'Sign in to pick up where you left off'}
            {authState === 'signup' && 'A simple, joyful way to take control of your time'}
            {authState === 'forgot' && "Enter your email and we'll send you an OTP to reset your password"}
            {authState === 'reset' && 'Check your email for the 6-digit OTP code and enter your new password'}
          </span>
        </div>

        <Card>
          {error ? <span style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</span> : null}
          {success ? <span style={{ color: '#059669', fontSize: 12, marginBottom: 8 }}>✨ {success}</span> : null}

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={authState !== 'reset'}
            style={{ marginBottom: 8 }}
          />

          {authState === 'reset' && (
            <Input
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit OTP code"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginBottom: 8 }}
            />
          )}

          {authState !== 'forgot' && (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder={authState === 'reset' ? 'New Password' : 'Password'}
                secureTextEntry={securePassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ paddingRight: 45 }}
              />
              <button
                onClick={() => setSecurePassword(!securePassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 10,
                  zIndex: 10,
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                type="button"
                suppressHydrationWarning
              >
                {securePassword ? <EyeOffIcon color="var(--color-text-secondary)" /> : <EyeIcon color="var(--color-text-secondary)" />}
              </button>
            </div>
          )}

          {authState === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, marginTop: -4 }}>
              <button
                onClick={async () => {
                  if (!email.trim()) {
                    setError('Please enter your email to log in with Passkey');
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  const err = await store.loginWithPasskey(email.trim());
                  setLoading(false);
                  if (err) setError(err);
                  else store.updateSettings({ onboardingComplete: true });
                }}
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}
                suppressHydrationWarning
              >
                🔑 Use Passkey
              </button>
              <button
                onClick={() => handleStateChange('forgot')}
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}
                suppressHydrationWarning
              >
                Forgot Password?
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', margin: '8px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                title={
                  authState === 'login' ? 'Log in' : authState === 'signup' ? 'Create Account' : authState === 'forgot' ? 'Send OTP' : 'Reset Password'
                }
                onPress={handleSubmit}
                disabled={!email.trim() || (authState !== 'forgot' && !password.trim()) || (authState === 'reset' && !otp.trim())}
              />

              {authState === 'login' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>or</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                  </div>

                  <button
                    onClick={handleGoogleClick}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      height: 44,
                      borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                    suppressHydrationWarning
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62v3.01h3.87c2.26-2.08 3.58-5.14 3.58-8.48z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.01c-1.08.72-2.45 1.16-4.06 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.11C3.18 21.88 7.39 24 12 24z" />
                      <path fill="#FBBC05" d="M5.32 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.61H1.21C.4 8.24 0 10.06 0 12s.4 3.76 1.21 5.39l4.11-3.11z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 6.61l4.11 3.11c.94-2.85 3.57-4.97 6.68-4.97z" />
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </div>
          )}
        </Card>

        <Row style={{ justifyContent: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {authState === 'login' && "Don't have an account?"}
            {authState === 'signup' && 'Already have an account?'}
            {(authState === 'forgot' || authState === 'reset') && 'Remembered your password?'}
          </span>
          <Button
            small
            variant="ghost"
            title={authState === 'login' ? 'Sign Up' : 'Log in'}
            onPress={() => handleStateChange(authState === 'login' ? 'signup' : 'login')}
          />
        </Row>
      </div>

      {/* Google Mock Account Chooser Modal */}
      {showGoogleChooser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setShowGoogleChooser(false)}
        >
          <Card style={{ width: '100%', maxWidth: 360, gap: 12 }} style-disabled="false">
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', display: 'block', marginBottom: 4 }}>
                Sign in with Google
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', display: 'block', marginBottom: 12 }}>
                Choose a Google account to continue to My Day
              </span>

              {[
                { name: 'Saurabh', email: 'saurabh@example.com' },
                { name: 'Gemini', email: 'gemini@google.com' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={async () => {
                    setLoading(true);
                    setShowGoogleChooser(false);
                    const err = await store.googleLogin('', true, acc.email, acc.name);
                    setLoading(false);
                    if (err) setError(err);
                    else store.updateSettings({ onboardingComplete: true });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  suppressHydrationWarning
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'var(--color-surface-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: 'var(--color-text)',
                    }}
                  >
                    {acc.name[0]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{acc.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{acc.email}</span>
                  </div>
                </button>
              ))}

              <div style={{ margin: '8px 0', borderTop: '1px solid var(--color-border)' }} />

              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>Or use a custom account:</span>
              <Input value={googleName} onChangeText={setGoogleName} placeholder="Name" />
              <Input value={googleEmail} onChangeText={setGoogleEmail} placeholder="Google email address" keyboardType="email-address" />

              <Row style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button title="Cancel" variant="secondary" onPress={() => setShowGoogleChooser(false)} />
                <Button
                  title="Continue"
                  onPress={async () => {
                    if (!googleEmail.trim()) return;
                    setLoading(true);
                    setShowGoogleChooser(false);
                    const nameVal = googleName.trim() || googleEmail.split('@')[0];
                    const err = await store.googleLogin('', true, googleEmail.trim(), nameVal);
                    setLoading(false);
                    if (err) setError(err);
                    else store.updateSettings({ onboardingComplete: true });
                  }}
                  disabled={!googleEmail.trim()}
                />
              </Row>
            </div>
          </Card>
        </div>
      )}

      {/* PWA Slide-up Install Popup */}
      {showInstallPopup && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 16,
            right: 16,
            maxWidth: 388,
            margin: '0 auto',
            zIndex: 10000,
            animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes slideUp {
              from { transform: translateY(110%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `,
            }}
          />
          <Card style={{
            boxShadow: 'var(--shadow-floating)',
            border: '1.5px solid var(--color-border)',
            padding: 20,
            gap: 12,
            backgroundColor: 'var(--color-surface)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📱 Install My Day App
                </span>
                <button
                  onClick={() => setShowInstallPopup(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    fontSize: 16,
                    fontWeight: 'bold',
                    padding: 4,
                  }}
                  suppressHydrationWarning
                >
                  ✕
                </button>
              </Row>

              {isIOS ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.4 }}>
                    Install this app on your iPhone for quick access and full-screen workspace:
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    1. Tap the Share button <span style={{ fontSize: 14 }}>⎋</span> at the bottom of Safari.
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    2. Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </span>
                  <Button title="Got it" onPress={() => setShowInstallPopup(false)} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    Add My Day to your home screen for quick loading, offline mode, and full-screen experience.
                  </span>
                  <Row style={{ gap: 8, marginTop: 4 }}>
                    <Button style={{ flex: 1 }} title="Install" onPress={handleInstallClick} />
                    <Button style={{ flex: 1 }} variant="secondary" title="Maybe Later" onPress={() => setShowInstallPopup(false)} />
                  </Row>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
