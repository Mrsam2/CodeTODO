import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/use-theme';

// Inline SVGs for the Password Eye Toggle Icons
const EyeIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Path d="M1 1l22 22" />
  </Svg>
);

export default function AuthScreen() {
  const store = useAppStore();
  const colors = useTheme();
  
  const [authState, setAuthState] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStateChange = (state: 'login' | 'signup' | 'forgot' | 'reset') => {
    setAuthState(state);
    setError(null);
    setSuccess(null);
    setPassword('');
    setOtp('');
    setSecurePassword(true);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Basic Validation
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
          // Auto-transition to the reset screen after a brief moment
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
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <ThemedText style={{ fontSize: 40 }}>
            {authState === 'forgot' || authState === 'reset' ? '🔑' : '✅'}
          </ThemedText>
        </View>

        <View style={{ gap: Spacing.two, marginBottom: Spacing.four, alignItems: 'center' }}>
          <ThemedText type="heading" style={{ textAlign: 'center' }}>
            {authState === 'login' && 'Welcome back!'}
            {authState === 'signup' && 'Create your account'}
            {authState === 'forgot' && 'Forgot Password'}
            {authState === 'reset' && 'Reset Password'}
          </ThemedText>
          <ThemedText
            type="body"
            themeColor="textSecondary"
            style={{ textAlign: 'center' }}
          >
            {authState === 'login' && 'Sign in to pick up where you left off'}
            {authState === 'signup' && 'A simple, joyful way to take control of your time'}
            {authState === 'forgot' && "Enter your email and we'll send you an OTP to reset your password"}
            {authState === 'reset' && 'Check your email for the 6-digit OTP code and enter your new password'}
          </ThemedText>
        </View>

        <Card>
          {error ? (
            <ThemedText style={styles.errorText}>
              ⚠️ {error}
            </ThemedText>
          ) : null}

          {success ? (
            <ThemedText style={styles.successText}>
              ✨ {success}
            </ThemedText>
          ) : null}

          {/* Email input */}
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={authState !== 'reset'} // freeze email while resetting
            style={{ marginBottom: Spacing.two }}
          />

          {/* OTP input - reset screen only */}
          {authState === 'reset' && (
            <Input
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit OTP code"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginBottom: Spacing.two }}
            />
          )}

          {/* Password input - login, signup, reset screens */}
          {authState !== 'forgot' && (
            <View style={styles.passwordContainer}>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder={authState === 'reset' ? 'New Password' : 'Password'}
                secureTextEntry={securePassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ paddingRight: 45 }}
              />
              <TouchableOpacity
                onPress={() => setSecurePassword(!securePassword)}
                style={styles.eyeButton}
                activeOpacity={0.6}
              >
                {securePassword ? (
                  <EyeOffIcon color={colors.textSecondary} />
                ) : (
                  <EyeIcon color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Forgot Password Link - login screen only */}
          {authState === 'login' && (
            <TouchableOpacity
              onPress={() => handleStateChange('forgot')}
              style={styles.forgotPasswordLink}
            >
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator size="small" color="#14161A" style={{ marginVertical: Spacing.two }} />
          ) : (
            <Button
              title={
                authState === 'login' ? 'Log in' :
                authState === 'signup' ? 'Create Account' :
                authState === 'forgot' ? 'Send OTP' :
                'Reset Password'
              }
              onPress={handleSubmit}
              disabled={
                !email.trim() ||
                (authState !== 'forgot' && !password.trim()) ||
                (authState === 'reset' && !otp.trim())
              }
            />
          )}
        </Card>

        {/* Bottom Switch Link */}
        <Row style={{ justifyContent: 'center', marginTop: Spacing.three }}>
          <ThemedText type="small" themeColor="textSecondary">
            {authState === 'login' && "Don't have an account?"}
            {authState === 'signup' && 'Already have an account?'}
            {(authState === 'forgot' || authState === 'reset') && 'Remembered your password?'}
          </ThemedText>
          <Button
            small
            variant="ghost"
            title={authState === 'login' ? 'Sign Up' : 'Log in'}
            onPress={() => {
              if (authState === 'login') {
                handleStateChange('signup');
              } else {
                handleStateChange('login');
              }
            }}
          />
        </Row>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    shadowColor: '#14161A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: Spacing.three,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 10,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.three,
    marginTop: -Spacing.one,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: Spacing.two,
    textAlign: 'left',
  },
  successText: {
    color: '#059669',
    fontSize: 12,
    marginBottom: Spacing.two,
    textAlign: 'left',
  },
});
