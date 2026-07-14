import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export default function AuthScreen() {
  const store = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      let errMessage;
      if (isLogin) {
        errMessage = await store.login(email.trim(), password.trim());
        if (!errMessage) {
          store.updateSettings({ onboardingComplete: true });
        }
      } else {
        errMessage = await store.signup(email.trim(), password.trim());
      }

      if (errMessage) {
        setError(errMessage);
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
          <ThemedText style={{ fontSize: 40 }}>✅</ThemedText>
        </View>

        <View style={{ gap: Spacing.two, marginBottom: Spacing.four, alignItems: 'center' }}>
          <ThemedText type="heading" style={{ textAlign: 'center' }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </ThemedText>
          <ThemedText
            type="body"
            themeColor="textSecondary"
            style={{ textAlign: 'center' }}
          >
            {isLogin ? 'Sign in to pick up where you left off' : 'A simple, joyful way to take control of your time'}
          </ThemedText>
        </View>

        <Card>
          {error ? (
            <ThemedText style={styles.errorText}>
              ⚠️ {error}
            </ThemedText>
          ) : null}

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            style={{ marginBottom: Spacing.two }}
          />

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            style={{ marginBottom: Spacing.three }}
          />

          {loading ? (
            <ActivityIndicator size="small" color="#14161A" style={{ marginVertical: Spacing.two }} />
          ) : (
            <Button
              title={isLogin ? 'Log in' : 'Create Account'}
              onPress={handleSubmit}
              disabled={!email.trim() || !password.trim()}
            />
          )}
        </Card>

        <Row style={{ justifyContent: 'center', marginTop: Spacing.three }}>
          <ThemedText type="small" themeColor="textSecondary">
            {isLogin ? "Don't have an account?" : 'Already a user?'}
          </ThemedText>
          <Button
            small
            variant="ghost"
            title={isLogin ? 'Sign Up' : 'Log in'}
            onPress={() => {
              setIsLogin(!isLogin);
              setError(null);
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
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: Spacing.two,
    textAlign: 'left',
  },
});
