# Athlo

Aplicativo de rastreamento de atividades esportivas pessoais - corrida, musculação e medidas corporais.

## Funcionalidades

### Corrida
- Registrar corridas com distância, tempo, pace, esforço
- Cálculo automático de pace/distância/tempo
- Histórico de atividades
- Edição e exclusão

### Musculação
- Criar divisões de treino (Push/Pull/Legs, ABC, etc.)
- Banco de exercícios por grupo muscular
- Criar exercícios personalizados
- Registrar treinos com peso, séries, repetições e RPE
- Acompanhar progressão de carga por exercício

### Medidas Corporais
- Registro de peso
- Percentual de gordura corporal
- Circunferências (peito, cintura, braços, coxas, etc.)
- Histórico e tendências

### Estatísticas
- Dashboard com filtro de período (7 dias, 30 dias, 1 ano, tudo)
- Gráficos de distância e pace ao longo do tempo
- Volume semanal de corrida
- Distribuição por grupo muscular
- Progressão de peso por exercício
- Tendência de peso corporal

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- JWT Authentication

### Frontend
- React Native / Expo SDK 54
- TypeScript
- React Navigation
- react-native-gifted-charts

## Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 18.16+ (recomendado 20+)
- npm ou yarn

### Backend

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/athlo.git
cd athlo

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -e .

# Rodar servidor
uvicorn athlo.api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar app (web)
npx expo start --web

# Rodar app (mobile)
npx expo start
```

## Uso

1. Acesse http://localhost:8081 (web) ou escaneie o QR code no Expo Go (mobile)
2. Crie uma conta ou faça login
3. Comece a registrar suas atividades!

### Navegação

| Aba | Função |
|-----|--------|
| Início | Dashboard com estatísticas e atividades recentes |
| Atividades | Lista de todas as atividades (corrida + força) |
| Corrida | Registrar nova corrida |
| Força | Gerenciar divisões e registrar treinos |
| Corpo | Registrar medidas corporais |
| Perfil | Configurações e logout (ícone no header) |

## API

Documentação interativa disponível em: http://localhost:8000/docs

### Endpoints Principais

```
POST   /auth/register          # Criar conta
POST   /auth/login             # Login
GET    /activities/running     # Listar corridas
POST   /activities/running     # Criar corrida
GET    /strength/divisions     # Listar divisões
POST   /strength/activities    # Registrar treino
GET    /body/measurements      # Listar medidas
GET    /body/weight-history    # Histórico de peso
```

## Estrutura do Projeto

```
athlo/
├── src/athlo/              # Backend FastAPI
│   ├── api/
│   │   ├── routes/         # Endpoints da API
│   │   ├── deps.py         # Dependências (auth)
│   │   └── main.py         # App entry point
│   ├── models/             # Modelos Pydantic
│   └── config.py           # Configurações
├── frontend/               # App React Native
│   └── src/
│       ├── components/     # Componentes reutilizáveis
│       ├── screens/        # Telas do app
│       ├── services/       # Serviço de API
│       ├── utils/          # Funções utilitárias
│       └── types/          # Tipos TypeScript
└── data/                   # Armazenamento JSON
```

## Roadmap

- [ ] Atividades de ciclismo
- [ ] Atividades de natação
- [ ] Exportar dados (CSV/JSON)
- [ ] Tema escuro
- [ ] Integração com GPS
- [ ] Definição de metas
- [ ] Notificações push

## Licença

Este projeto está sob a licença MIT.
