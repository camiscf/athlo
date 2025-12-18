# Athlo Design System - Próximos Passos

## Setup Inicial (Fazer Primeiro)

### 1. Adicionar ThemeProvider no App.tsx
```tsx
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* resto do app */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 2. Atualizar app.json para dark mode
```json
{
  "expo": {
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#0A0A0B"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0A0A0B"
      }
    }
  }
}
```

---

## Migração de Telas (Ordem Sugerida)

### Prioridade Alta (Telas mais usadas)
- [ ] `MainNavigator.tsx` - Tab bar e headers
- [ ] `HomeScreen.tsx` - Dashboard principal
- [ ] `ActivitiesScreen.tsx` - Lista de atividades
- [ ] `StatsScreen.tsx` - Estatísticas e gráficos

### Prioridade Média
- [ ] `LoginScreen.tsx` - Tela de login
- [ ] `RegisterScreen.tsx` - Tela de cadastro
- [ ] `AddActivityScreen.tsx` - Formulário de atividade
- [ ] `ActivityDetailScreen.tsx` - Detalhes de corrida

### Prioridade Baixa
- [ ] `DivisionsScreen.tsx` - Divisões de treino
- [ ] `EditDivisionScreen.tsx` - Editar divisão
- [ ] `BodyScreen.tsx` - Medidas corporais
- [ ] `ProfileScreen.tsx` - Perfil do usuário
- [ ] `RecordStrengthWorkoutScreen.tsx` - Registrar treino
- [ ] `StrengthStatsScreen.tsx` - Stats de força
- [ ] `RunningStatsScreen.tsx` - Stats de corrida

---

## Migração de Componentes

- [ ] `StatCard.tsx` - Usar tokens do tema
- [ ] `SimpleBarChart.tsx` - Cores do tema para gráficos
- [ ] `SimpleLineChart.tsx` - Cores do tema para gráficos
- [ ] `PeriodSelector.tsx` - Estilo do tema
- [ ] `DatePicker.tsx` - Dark mode
- [ ] `TimePicker.tsx` - Dark mode

---

## Padrão de Migração

Para cada arquivo, substituir cores hardcoded:

```tsx
// ANTES
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});

// DEPOIS
import { useColors } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../theme';

function MyScreen() {
  const theme = useColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Título
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    ...typography.heading3,
  },
});
```

---

## Referência Rápida de Cores

| Uso | Token |
|-----|-------|
| Fundo do app | `theme.background.primary` (#0A0A0B) |
| Cards | `theme.background.secondary` (#141416) |
| Inputs | `theme.background.tertiary` (#1C1C1F) |
| Texto principal | `theme.text.primary` (#FAFAFA) |
| Texto secundário | `theme.text.secondary` (#A1A1AA) |
| Placeholder | `theme.text.tertiary` (#71717A) |
| Botão/Destaque | `theme.accent.primary` (#F59E0B) |
| Sucesso | `theme.semantic.success` (#22C55E) |
| Erro | `theme.semantic.error` (#EF4444) |
| Borda | `theme.border.primary` (#27272A) |

---

## Arquivos do Design System

```
frontend/src/theme/
├── colors.ts      # Paleta de cores dark/light
├── typography.ts  # Tamanhos e pesos de fonte
├── spacing.ts     # Espaçamento, radius, sombras
└── index.ts       # Export central

frontend/src/context/
└── ThemeContext.tsx  # Provider e hooks
```

## Documentação Completa

Ver: `.claude/plans/memoized-painting-parasol.md`
