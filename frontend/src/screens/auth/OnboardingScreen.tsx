import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { AuthStackScreenProps } from '../../navigation/types';

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  theme: any;
}

function FeatureItem({ icon, title, description, theme }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.accent.muted }]}>
        <Feather name={icon as any} size={20} color={theme.accent.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.text.secondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }: AuthStackScreenProps<'Onboarding'>) {
  const theme = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Background image placeholder */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.backgroundOverlay, { backgroundColor: theme.background.primary }]} />
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Domine seu{'\n'}
            <Text style={{ color: theme.accent.primary }}>Ritmo.</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Monitore corrida, natação e academia com precisão absoluta. Sua performance, seus dados.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="activity"
            title="Registro Multiesporte"
            description="Corrida, Natação, Ciclismo"
            theme={theme}
          />
          <FeatureItem
            icon="bar-chart-2"
            title="Análise de Performance"
            description="Gráficos e evolução detalhada"
            theme={theme}
          />
          <FeatureItem
            icon="heart"
            title="Métricas de Saúde"
            description="Frequência cardíaca e recuperação"
            theme={theme}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent.primary }]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Começar Agora</Text>
            <Feather name="arrow-right" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text.secondary }]}>
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  backgroundOverlay: {
    flex: 1,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  titleContainer: {
    marginTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 50,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  buttonsContainer: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
  },
});
