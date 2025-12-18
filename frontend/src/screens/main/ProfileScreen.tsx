import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';

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
        {showArrow && onPress && (
          <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const theme = useColors();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Units
  const [isUpdatingUnits, setIsUpdatingUnits] = useState(false);

  // About Modal
  const [showAbout, setShowAbout] = useState(false);

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

  function openEditProfile() {
    setEditName(user?.name || '');
    setShowEditProfile(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Por favor, insira um nome.');
      }
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.updateProfile({ name: editName.trim() });
      await refreshUser();
      setShowEditProfile(false);
      if (Platform.OS === 'web') {
        window.alert('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erro ao atualizar perfil. Tente novamente.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  }

  function openChangePassword() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowChangePassword(true);
  }

  async function handleChangePassword() {
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Senha atual e obrigatoria');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Nova senha deve ter no minimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas nao coincidem');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setShowChangePassword(false);
      if (Platform.OS === 'web') {
        window.alert('Senha alterada com sucesso!');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao alterar senha';
      setPasswordError(message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleToggleUnits() {
    const newUnits = user?.preferred_units === 'metric' ? 'imperial' : 'metric';

    setIsUpdatingUnits(true);
    try {
      await api.updateProfile({ preferred_units: newUnits });
      await refreshUser();
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erro ao alterar unidade. Tente novamente.');
      }
    } finally {
      setIsUpdatingUnits(false);
    }
  }

  function handleHelp() {
    if (Platform.OS === 'web') {
      window.alert(
        'Athlo - Ajuda\n\n' +
        '• Corrida: Use o cronômetro ou registre manualmente.\n' +
        '• Força: Crie divisoes e registre seus treinos.\n' +
        '• Corpo: Acompanhe suas medições corporais.\n' +
        '• Metas: Defina metas semanais ou mensais.\n\n' +
        'Duvidas? Entre em contato pelo menu Contato.'
      );
    }
  }

  function handleContact() {
    const email = 'suporte@athlo.app';
    const subject = encodeURIComponent('Suporte Athlo');
    const body = encodeURIComponent('Ola! Preciso de ajuda com...');

    if (Platform.OS === 'web') {
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
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
              onPress={openEditProfile}
            />
            <SettingsItem
              icon="lock"
              label="Alterar Senha"
              theme={theme}
              onPress={openChangePassword}
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
            <TouchableOpacity
              style={[styles.settingsItem, { borderBottomColor: theme.border.primary }]}
              onPress={handleToggleUnits}
              disabled={isUpdatingUnits}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: theme.accent.muted }]}>
                  {isUpdatingUnits ? (
                    <ActivityIndicator size="small" color={theme.accent.primary} />
                  ) : (
                    <Feather name="globe" size={18} color={theme.accent.primary} />
                  )}
                </View>
                <Text style={[styles.settingsLabel, { color: theme.text.primary }]}>
                  Unidades
                </Text>
              </View>
              <View style={styles.unitsToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitOption,
                    user?.preferred_units === 'metric' && styles.unitOptionActive,
                    { backgroundColor: user?.preferred_units === 'metric' ? theme.accent.primary : theme.background.tertiary },
                  ]}
                  onPress={() => user?.preferred_units !== 'metric' && handleToggleUnits()}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      { color: user?.preferred_units === 'metric' ? '#000' : theme.text.secondary },
                    ]}
                  >
                    km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitOption,
                    user?.preferred_units === 'imperial' && styles.unitOptionActive,
                    { backgroundColor: user?.preferred_units === 'imperial' ? theme.accent.primary : theme.background.tertiary },
                  ]}
                  onPress={() => user?.preferred_units !== 'imperial' && handleToggleUnits()}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      { color: user?.preferred_units === 'imperial' ? '#000' : theme.text.secondary },
                    ]}
                  >
                    mi
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            <SettingsItem
              icon="moon"
              label="Tema"
              value="Escuro"
              theme={theme}
              showArrow={false}
            />
            <SettingsItem
              icon="bell"
              label="Notificações"
              value="Em breve"
              theme={theme}
              showArrow={false}
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
              onPress={handleHelp}
            />
            <SettingsItem
              icon="message-circle"
              label="Contato"
              theme={theme}
              onPress={handleContact}
            />
            <SettingsItem
              icon="info"
              label="Sobre o App"
              value="v1.0.0"
              theme={theme}
              onPress={() => setShowAbout(true)}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Editar Perfil
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditProfile(false)}
                style={[styles.closeButton, { backgroundColor: theme.background.tertiary }]}
              >
                <Feather name="x" size={20} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>NOME</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background.tertiary,
                    color: theme.text.primary,
                    borderColor: theme.border.primary,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor={theme.text.tertiary}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent.primary },
                isSavingProfile && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Alteracoes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Alterar Senha
              </Text>
              <TouchableOpacity
                onPress={() => setShowChangePassword(false)}
                style={[styles.closeButton, { backgroundColor: theme.background.tertiary }]}
              >
                <Feather name="x" size={20} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {passwordError ? (
                <View style={[styles.errorBox, { backgroundColor: theme.semantic.errorMuted }]}>
                  <Feather name="alert-circle" size={16} color={theme.semantic.error} />
                  <Text style={[styles.errorText, { color: theme.semantic.error }]}>
                    {passwordError}
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>SENHA ATUAL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background.tertiary,
                    color: theme.text.primary,
                    borderColor: theme.border.primary,
                  },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Digite sua senha atual"
                placeholderTextColor={theme.text.tertiary}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: theme.text.secondary, marginTop: 16 }]}>
                NOVA SENHA
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background.tertiary,
                    color: theme.text.primary,
                    borderColor: theme.border.primary,
                  },
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimo 8 caracteres"
                placeholderTextColor={theme.text.tertiary}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: theme.text.secondary, marginTop: 16 }]}>
                CONFIRMAR NOVA SENHA
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background.tertiary,
                    color: theme.text.primary,
                    borderColor: theme.border.primary,
                  },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a nova senha"
                placeholderTextColor={theme.text.tertiary}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent.primary },
                isSavingPassword && styles.saveButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isSavingPassword}
            >
              {isSavingPassword ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Alterar Senha</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Sobre o Athlo
              </Text>
              <TouchableOpacity
                onPress={() => setShowAbout(false)}
                style={[styles.closeButton, { backgroundColor: theme.background.tertiary }]}
              >
                <Feather name="x" size={20} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutContent}>
              <View style={[styles.aboutLogo, { backgroundColor: theme.accent.primary }]}>
                <Feather name="activity" size={40} color="#000" />
              </View>

              <Text style={[styles.aboutAppName, { color: theme.text.primary }]}>
                Athlo
              </Text>
              <Text style={[styles.aboutVersion, { color: theme.text.secondary }]}>
                Versao 1.0.0
              </Text>

              <View style={[styles.aboutDivider, { backgroundColor: theme.border.primary }]} />

              <Text style={[styles.aboutDescription, { color: theme.text.secondary }]}>
                Seu companheiro completo para treinos de corrida e musculação.
                Registre atividades, acompanhe seu progresso e alcance suas metas.
              </Text>

              <View style={styles.aboutFeatures}>
                <View style={styles.aboutFeatureItem}>
                  <Feather name="zap" size={16} color={theme.accent.primary} />
                  <Text style={[styles.aboutFeatureText, { color: theme.text.primary }]}>
                    Corrida com cronômetro
                  </Text>
                </View>
                <View style={styles.aboutFeatureItem}>
                  <Feather name="target" size={16} color={theme.accent.primary} />
                  <Text style={[styles.aboutFeatureText, { color: theme.text.primary }]}>
                    Treinos de força
                  </Text>
                </View>
                <View style={styles.aboutFeatureItem}>
                  <Feather name="trending-up" size={16} color={theme.accent.primary} />
                  <Text style={[styles.aboutFeatureText, { color: theme.text.primary }]}>
                    Medições corporais
                  </Text>
                </View>
                <View style={styles.aboutFeatureItem}>
                  <Feather name="flag" size={16} color={theme.accent.primary} />
                  <Text style={[styles.aboutFeatureText, { color: theme.text.primary }]}>
                    Metas personalizadas
                  </Text>
                </View>
              </View>

              <Text style={[styles.aboutCopyright, { color: theme.text.tertiary }]}>
                2024 Athlo. Todos os direitos reservados.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  unitsToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unitOptionActive: {},
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  // About modal
  aboutContent: {
    alignItems: 'center',
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutAppName: {
    fontSize: 24,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  aboutDivider: {
    width: '80%',
    height: 1,
    marginVertical: 20,
  },
  aboutDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  aboutFeatures: {
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  aboutFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  aboutFeatureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutCopyright: {
    fontSize: 12,
    marginTop: 24,
  },
});
