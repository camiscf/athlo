import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../context/ThemeContext';
import { AuthStackScreenProps } from '../../navigation/types';

export default function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { login } = useAuth();
  const theme = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Erro', 'E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleTabChange(tab: 'login' | 'register') {
    if (tab === 'register') {
      navigation.navigate('Register');
    }
    setActiveTab(tab);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.accent.primary }]}>
            <Feather name="zap" size={24} color="#000000" />
          </View>
          <Text style={[styles.logoText, { color: theme.text.primary }]}>Athlo</Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: theme.background.secondary }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'login' && [styles.tabActive, { backgroundColor: theme.accent.primary }],
            ]}
            onPress={() => handleTabChange('login')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'login' ? '#000000' : theme.text.secondary },
              ]}
            >
              Entrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'register' && [styles.tabActive, { backgroundColor: theme.accent.primary }],
            ]}
            onPress={() => handleTabChange('register')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'register' ? '#000000' : theme.text.secondary },
              ]}
            >
              Cadastrar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: theme.text.primary }]}>
            Bem-vindo de volta
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.text.secondary }]}>
            Pronto para superar seus limites hoje?
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={[styles.inputContainer, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}>
            <Feather name="mail" size={20} color={theme.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text.primary, backgroundColor: 'transparent' }]}
              placeholder="E-mail ou Usuário"
              placeholderTextColor={theme.text.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={[styles.inputContainer, { backgroundColor: theme.background.tertiary, borderColor: theme.border.primary }]}>
            <Feather name="lock" size={20} color={theme.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text.primary, backgroundColor: 'transparent' }]}
              placeholder="Senha"
              placeholderTextColor={theme.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={theme.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.text.secondary }]}>
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent.primary },
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Entrar</Text>
                <Feather name="arrow-right" size={20} color="#000000" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.border.primary }]} />
          <Text style={[styles.dividerText, { color: theme.text.tertiary }]}>OU CONTINUE COM</Text>
          <View style={[styles.divider, { backgroundColor: theme.border.primary }]} />
        </View>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.background.secondary }]}>
            <Feather name="smartphone" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.googleText, { color: theme.text.primary }]}>G</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  welcomeContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
