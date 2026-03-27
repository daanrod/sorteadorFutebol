# TODO — Sorteador Futebol

## Stack
- Backend: Node.js (Express)
- Storage: JSON file (leve, escala pra banco depois se precisar)
- Frontend: React + Tailwind + shadcn/ui

---

## Etapas

### 1. Backend + API
- [ ] Servidor Express com rotas REST
- [ ] Armazenamento em arquivo JSON (jogadores, times, sorteio)
- [ ] Sessão via cookie (login simples)

### 2. Painel Admin
- [ ] Cadastro de jogadores (nome + goleiro sim/não)
- [ ] Definir top players (1 por time, balancear força)
- [ ] Botão resetar sorteio

### 3. Lógica de Sorteio
- [ ] 4 times x 5 jogadores (futsal)
- [ ] Top players fixos (admin define)
- [ ] Max 1 goleiro por time (sobrou? vai pra linha)
- [ ] Restante sorteado aleatoriamente

### 4. Tela do Jogador
- [ ] Login simples (criar usuario, sem verificação)
- [ ] Botão "Sortear" — animação de roleta
- [ ] Quadro de times com nome do jogador destacado

### 5. Sessão e Validação
- [ ] Cookie para auto-login no próximo acesso
- [ ] Validar se sorteio é de dia diferente
- [ ] Admin pode resetar manualmente

### 6. Deploy
- [ ] Subir no servidor do usuário

---

## Regras de Negócio
- 4 times, 5 por time
- Top players = 1 por time (admin escolhe)
- Goleiro = max 1 por time
- Sorteio online, antes do jogo
- Cada jogador aperta o botão e vê a roleta
