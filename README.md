# Sorteador Futebol

Aplicativo web para sortear times de futsal de forma justa e divertida. Chega de perder tempo de quadra com fichas e papel!

## Como funciona

1. **Admin** cadastra os jogadores (nome + posicao: linha ou goleiro)
2. **Admin** marca os top players (1 por time, para balancear)
3. **Jogadores** acessam o link, fazem login pelo nome e confirmam presenca
4. **Admin** realiza o sorteio quando todos confirmaram
5. **Jogadores** apertam o botao e veem a animacao de roleta com seu time

## Regras do sorteio

- 4 times de ate 5 jogadores (futsal)
- Top players sao distribuidos primeiro (1 por time)
- Maximo 1 goleiro por time (excedentes jogam na linha)
- Restante dos jogadores e sorteado aleatoriamente
- Times sao balanceados por quantidade

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Backend | Python (FastAPI) + Uvicorn |
| Storage | JSON file (leve, escalavel para banco depois) |
| Testes | pytest + pytest-cov (backend) |

## Requisitos

- Node.js 18+
- Python 3.10+
- pnpm

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

O frontend roda em `http://localhost:5173` e faz proxy das chamadas `/api` para o backend em `http://localhost:8000`.

### Testes

```bash
cd backend
source venv/bin/activate
pytest -v --cov=. --cov-report=term-missing
```

## Rotas da API

### Auth
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/login` | Login jogador (por nome) |
| GET | `/api/me` | Jogador autenticado |
| POST | `/api/logout` | Logout |
| POST | `/api/admin/login` | Login admin |

### Jogadores
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/players` | Listar jogadores |
| POST | `/api/players` | Cadastrar (admin) |
| PATCH | `/api/players/:id` | Atualizar (admin) |
| DELETE | `/api/players/:id` | Remover (admin) |
| PATCH | `/api/presenca/:status` | Confirmar presenca/ausencia |

### Sorteio
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/sorteio` | Realizar sorteio (admin) |
| GET | `/api/sorteio` | Ver resultado |
| POST | `/api/admin/reset-sorteio` | Limpar sorteio |
| POST | `/api/admin/reset-presencas` | Reset semanal |

## Paginas

| Rota | Pagina |
|------|--------|
| `/` | Login do jogador |
| `/jogador` | Presenca + roleta |
| `/times` | Quadro de times |
| `/admin` | Login admin |
| `/admin/painel` | Painel de gestao |

## Credenciais padrao

- **Admin**: senha `admin123` (alterar em `backend/main.py`)

## Licenca

MIT
