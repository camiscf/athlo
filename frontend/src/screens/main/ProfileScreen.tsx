import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../context/ThemeContext';

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  theme: any;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingsItem({ icon, label, value, onPress, theme, showArrow = true, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: theme.border.primary }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View
          style={[
            styles.settingsIcon,
            { backgroundColor: danger ? theme.semantic.errorMuted : theme.accent.muted },
          ]}
        >
          <Feather
            name={icon as any}
            size={18}
            color={danger ? theme.semantic.error : theme.accent.primary}
          />
        </View>
        <Text
          style={[
            styles.settingsLabel,
            { color: danger ? theme.semantic.error : theme.text.primary },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && (
          <Text style={[styles.settingsValue, { color: theme.text.secondary }]}>{value}</Text>
        )}
        {showArrow && (
          <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useColors();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    const confirmLogout = Platform.OS === 'web'
      ? window.confirm('Tem certeza que deseja sair da sua conta?')
      : true;

    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erro ao sair. Tente novamente.');
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.background.secondary }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text.primary }]}>
              {user?.name || 'Usuario'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.text.secondary }]}>
              {user?.email || ''}
            </Text>
            <View style={[styles.memberBadge, { backgroundColor: theme.accent.muted }]}>
              <Feather name="calendar" size={12} color={theme.accent.primary} />
              <Text style={[styles.memberText, { color: theme.accent.primary }]}>
                Membro desde {memberSince}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>CONTA</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.background.secondary }]}>
            <SettingsItem
              icon="user"
              label="Editar Perfil"
              theme={theme}
            />
            <SettingsItem
              icon="lock"
              label="Alterar Senha"
              theme={theme}
            />
            <SettingsItem
              icon="mail"
              label="Email"
              value={user?.email}
              theme={theme}
              showArrow={false}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>PREFERENCIAS</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.background.secondary }]}>
            <SettingsItem
              icon="globe"
              label="Unidades"
              value={user?.preferred_units === 'metric' ? 'Metrico (km)' : 'Imperial (mi)'}
              theme={theme}
            />
            <SettingsItem
              icon="moon"
              label="Tema"
              value="Escuro"
              theme={theme}
            />
            <SettingsItem
              icon="bell"
              label="Notificacoes"
              theme={theme}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>SUPORTE</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.background.secondary }]}>
            <SettingsItem
              icon="help-circle"
              label="Ajuda e FAQ"
              theme={theme}
            />
            <SettingsItem
              icon="message-circle"
              label="Contato"
              theme={theme}
            />
            <SettingsItem
              icon="info"
              label="Sobre o App"
              value="v1.0.0"
              theme={theme}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={[styles.settingsCard, { backgroundColor: theme.background.secondary }]}>
            <TouchableOpacity
              style={[styles.logoutItem, { borderBottomColor: 'transparent' }]}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: theme.semantic.errorMuted }]}>
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color={theme.semantic.error} />
                  ) : (
                    <Feather name="log-out" size={18} color={theme.semantic.error} />
                  )}
                </View>
                <Text style={[styles.settingsLabel, { color: theme.semantic.error }]}>
                  {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            Athlo v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            Feito com dedicacao para atletas
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsValue: {
    fontSize: 14,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
