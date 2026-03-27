# Design System — Sorteador Futebol

## Direction
Personality: Energia & Simplicidade
Foundation: Dark (cinza escuro / preto — quadra à noite)
Depth: Surface color shifts (sem shadows pesados)

## Tokens

### Spacing
Base: 4px
Scale: 4, 8, 12, 16, 24, 32, 48

### Colors

#### Base
--bg-base: hsl(220, 15%, 8%)
--bg-card: hsl(220, 15%, 12%)
--bg-elevated: hsl(220, 15%, 16%)
--foreground: hsl(0, 0%, 95%)
--secondary: hsl(220, 10%, 65%)
--muted: hsl(220, 10%, 45%)
--faint: hsl(220, 10%, 25%)
--border: rgba(255, 255, 255, 0.08)

#### Times (coletes reais)
--time-amarelo: hsl(48, 95%, 55%)
--time-azul: hsl(215, 85%, 55%)
--time-verde: hsl(145, 70%, 45%)
--time-vermelho: hsl(0, 80%, 55%)

#### Semântico
--presente: hsl(145, 70%, 45%)
--ausente: hsl(0, 80%, 55%)
--accent: hsl(215, 85%, 55%)
--accent-hover: hsl(215, 85%, 45%)

### Radius
Scale: 6px, 8px, 12px (moderado — não muito redondo, não quadrado)

### Typography
Font: Sora (display + body)
Scale: 12, 13, 14 (base), 16, 20, 28, 36
Weights: 400, 500, 600, 700
Mono: JetBrains Mono (contadores, dados)

## Patterns

### Card Default
- Background: var(--bg-card)
- Border: 1px solid var(--border)
- Padding: 16px
- Radius: 12px

### Button Primary
- Background: var(--accent)
- Height: 44px
- Padding: 12px 20px
- Radius: 8px
- Font: 14px, 600 weight
- Hover: var(--accent-hover)

### Badge Time
- Padding: 4px 12px
- Radius: 6px
- Font: 12px, 600 weight, uppercase
- Background: cor do time com 20% opacidade
- Text: cor do time

### Badge Presenca
- Presente: bg verde/10%, text verde, dot verde
- Ausente: bg vermelho/10%, text vermelho, dot vermelho

### Player Card
- Background: var(--bg-card)
- Border-left: 3px solid cor-do-time (quando sorteado)
- Padding: 12px 16px
- Radius: 8px

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Dark theme | Quadra à noite, visual esportivo, contraste com cores dos times | 2026-03-26 |
| 4 cores de colete | Amarelo, Azul, Verde, Vermelho — cores reais dos coletes usados | 2026-03-26 |
| Sora font | Geométrica, esportiva, legível em mobile | 2026-03-26 |
| Verde/vermelho presença | Reconhecimento instantâneo sem precisar ler | 2026-03-26 |
| Sem shadows | Surface shifts bastam, visual limpo e moderno | 2026-03-26 |
