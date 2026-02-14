# Revisão de Design: FinancePro — Todas as Páginas

**Data da Revisão**: 2026-02-14  
**Rotas Analisadas**: `/login`, `/register`, `/` (Dashboard), `/transactions`, `/categories`, `/budgets`, `/goals`, `/reports`, `/import`  
**Áreas de Foco**: Visual Design, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

## Resumo

O FinancePro possui uma base sólida com um design system bem definido (CSS custom properties, tipografia com Outfit + Inter, dark mode). Porém, existem problemas significativos de acessibilidade (landmarks ARIA ausentes, emojis sem texto alternativo), UX (reloads completos da página, ausência de navegação mobile), e performance (FCP de 6.6s na primeira carga, Google Fonts bloqueando renderização). A aplicação também apresenta código CSS duplicado entre páginas e inconsistências nos padrões de modais e formulários.

## Problemas Encontrados

| # | Problema | Criticidade | Categoria | Localização |
|---|---------|-------------|-----------|-------------|
| 1 | **Página de login sem landmark `<main>`** — O documento não possui landmark principal, violando WCAG 2.4.1. Conteúdo do formulário não está dentro de landmarks ARIA. Confirmado pelo audit axe-core. | 🔴 Crítico | Acessibilidade | `src/app/(auth)/login/page.tsx:40-93` |
| 2 | **Conteúdo fora de landmarks ARIA** — Nenhuma das páginas de autenticação envolve o conteúdo em `<main>`, `<nav>`, `<header>` ou `<footer>`. O layout do dashboard usa `<main>` mas as páginas auth não. | 🔴 Crítico | Acessibilidade | `src/app/(auth)/login/page.tsx:40-93`, `src/app/(auth)/register/page.tsx:38-134` |
| 3 | **Emojis usados como ícones sem texto alternativo** — Em toda a aplicação, emojis são usados como ícones visuais (📊💸🏷️📋🎯📈📥💰🗑️) sem `aria-hidden="true"` e sem texto `sr-only` correspondente. Leitores de tela lerão "emoji money bag" ao invés da função. | 🔴 Crítico | Acessibilidade | `src/components/layout/Sidebar.tsx:20-27`, `src/app/(dashboard)/DashboardClient.tsx:81-108` |
| 4 | **Sem navegação mobile** — No breakpoint `≤768px`, o sidebar desaparece completamente (`--sidebar-width: 0px`) mas não há menu hamburger, bottom nav, ou qualquer alternativa de navegação para usuários mobile. | 🔴 Crítico | Responsivo | `src/app/globals.css:477-481`, `src/components/layout/Sidebar.tsx` |
| 5 | **Badges usados como botões sem role adequado** — Na lista de transações, badges de status (Pago/Pendente/Atrasado) são elementos `<button>` estilizados como badges. Falta `role="switch"` ou `aria-pressed` para indicar comportamento de toggle. | 🟠 Alto | Acessibilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:115-123` |
| 6 | **Modais sem trap de foco e sem `role="dialog"`** — Todos os modais (criar transação, categoria, orçamento, meta) não possuem `role="dialog"`, `aria-modal="true"`, nem trap de foco. O foco pode escapar para elementos atrás do overlay. | 🟠 Alto | Acessibilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:135-217`, `src/app/(dashboard)/categories/CategoriesClient.tsx:109-139`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:122-148`, `src/app/(dashboard)/goals/GoalsClient.tsx:152-183` |
| 7 | **`window.location.reload()` para atualizar dados** — Após criar/deletar transações, categorias, orçamentos e metas, a aplicação faz `window.location.reload()` ao invés de revalidar via `router.refresh()` ou atualizar o state local. Causa flash visual, perda de scroll e experiência lenta. | 🟠 Alto | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:41,57,66`, `src/app/(dashboard)/categories/CategoriesClient.tsx:29,37,44`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:30,38`, `src/app/(dashboard)/goals/GoalsClient.tsx:30,38,46` |
| 8 | **Google Fonts carregado via `@import` no CSS** — O carregamento de fontes via `@import url(...)` no `globals.css` bloqueia a renderização da página. Deveria usar `next/font` do Next.js para carregamento otimizado com font-display swap. | 🟠 Alto | Performance | `src/app/globals.css:9` |
| 9 | **FCP de 6.6s na primeira carga** — O First Contentful Paint na primeira visita à página de login foi de 6640ms (TTFB 5954ms). Isso indica problemas de performance no servidor ou carregamento de fontes bloqueante. | 🟠 Alto | Performance | `src/app/globals.css:9`, `src/app/layout.tsx` |
| 10 | **Sem botão de logout visível** — Em nenhuma página existe um botão para fazer logout. O TopBar mostra apenas toggle de tema e avatar, mas sem opção de sair da conta. | 🟠 Alto | UX/Usabilidade | `src/components/layout/TopBar.tsx:28-65`, `src/components/layout/Sidebar.tsx:29-63` |
| 11 | **`confirm()` nativo para confirmação de exclusão** — Diálogos `confirm()` do browser são usados para confirmar exclusão de transações, orçamentos e metas. São visualmente inconsistentes com o design system e não personalizáveis. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:53`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:34`, `src/app/(dashboard)/goals/GoalsClient.tsx:42` |
| 12 | **Sem feedback visual de sucesso após ações** — Após criar uma transação, categoria ou orçamento com sucesso, não há toast/notification de confirmação. A página simplesmente recarrega, deixando o usuário sem certeza se a ação foi bem-sucedida. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:39-43`, `src/app/(dashboard)/categories/CategoriesClient.tsx:27-29` |
| 13 | **Filtros duplicados — CSS repetido entre páginas** — Os estilos de `.filterBtn`, `.filterActive`, e `.filters` são idênticos em `Transactions.module.css`, `Categories.module.css` e `Goals.module.css`. Deveria ser um componente reutilizável `FilterTabs`. | 🟡 Médio | Consistência | `src/app/(dashboard)/transactions/Transactions.module.css:22-47`, `src/app/(dashboard)/categories/Categories.module.css:20-45`, `src/app/(dashboard)/goals/Goals.module.css:20-45` |
| 14 | **Padrão de header de página duplicado** — O layout `header + title + action button` é repetido identicamente em todas as páginas do dashboard, mas não é um componente reutilizável. | 🟡 Médio | Consistência | `src/app/(dashboard)/transactions/TransactionsClient.tsx:74-79`, `src/app/(dashboard)/categories/CategoriesClient.tsx:49-54`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:46-51`, `src/app/(dashboard)/goals/GoalsClient.tsx:50-56` |
| 15 | **Cores hardcoded nos gráficos** — `#10B981` e `#EF4444` são usados diretamente no BarChart ao invés dos CSS custom properties `var(--success)` e `var(--danger)`. Também o array `DEFAULT_COLORS` para o pie chart não usa tokens do design system. | 🟡 Médio | Visual Design | `src/app/(dashboard)/DashboardClient.tsx:31-34,183-184` |
| 16 | **Cores hardcoded no módulo de Orçamentos** — `#34D399` e `#FCA5A5` são usados diretamente em `Budgets.module.css` ao invés de `var(--success)` e `var(--danger-light)`. | 🟡 Médio | Consistência | `src/app/(dashboard)/budgets/Budgets.module.css:43-48` |
| 17 | **Seletor de mês desconectado das páginas** — O TopBar do layout do dashboard tem controles de mês (prev/next), mas as páginas server components (Dashboard, Transactions, Budgets, Reports) pegam o mês atual via `new Date()` e ignoram o estado do layout. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/layout.tsx:22-44`, `src/app/(dashboard)/page.tsx:18-20`, `src/app/(dashboard)/transactions/page.tsx:17-19` |
| 18 | **Dashboard layout inteiro como Client Component** — O layout do dashboard é um `'use client'` component, perdendo benefícios de Server Components. O seletor de mês e sidebar poderiam ser client components isolados, com o layout sendo um server component. | 🟡 Médio | Performance | `src/app/(dashboard)/layout.tsx:7` |
| 19 | **Botão de delete usa emoji 🗑️ sem texto acessível** — Botões de exclusão em várias páginas usam apenas um emoji com `title` attribute. `title` não é suficiente para acessibilidade — precisa de `aria-label` ou texto `sr-only`. | 🟡 Médio | Acessibilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:124`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:103` |
| 20 | **Sem skip navigation link** — Nenhuma página possui um link "Pular para o conteúdo principal" para usuários de teclado/leitores de tela. | 🟡 Médio | Acessibilidade | `src/app/layout.tsx:16-24` |
| 21 | **Sem estados de loading/skeleton** — Quando páginas do dashboard estão carregando dados do servidor, não há skeleton screens ou estados de loading. O usuário vê uma tela em branco até os dados chegarem. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/transactions/page.tsx` |
| 22 | **Sem paginação na lista de transações** — A lista de transações carrega todas as transações do mês de uma vez, sem paginação ou scroll infinito. Para meses com muitas transações, isso pode ser problemático. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:95-131` |
| 23 | **Sem busca na página de transações** — Não existe campo de busca para encontrar transações por descrição, categoria ou valor. | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:73-79` |
| 24 | **Tabela de relatórios sem responsividade adequada** — A tabela de extrato mensal tem `overflow-x: auto` mas não adapta o layout para mobile (ex: cards ao invés de tabela). | 🟡 Médio | Responsivo | `src/app/(dashboard)/reports/Reports.module.css:96-98`, `src/app/(dashboard)/reports/ReportsClient.tsx:103-133` |
| 25 | **Formulário de transação com muitos campos em modal** — O modal de criação de transação tem 8 campos em sequência. Poderia beneficiar de um stepper ou melhor organização visual (seções, grid). | 🟡 Médio | UX/Usabilidade | `src/app/(dashboard)/transactions/TransactionsClient.tsx:144-213` |
| 26 | **Sem indicadores de foco customizados** — Embora os inputs tenham `:focus` com `box-shadow`, botões e links não possuem estilos de focus visíveis além do padrão do browser, que pode ser sutil. | ⚪ Baixo | Acessibilidade | `src/app/globals.css:245-256` |
| 27 | **Recharts não usa dynamic import** — O Recharts (~250KB) é importado estáticamente no DashboardClient. Poderia usar `React.lazy()` ou `next/dynamic` para reduzir o bundle inicial. | ⚪ Baixo | Performance | `src/app/(dashboard)/DashboardClient.tsx:8-12` |
| 28 | **Animação slideInUp aplicada em toda navegação** — A animação de entrada é aplicada ao `.content` no layout, significando que ela roda em toda navegação entre páginas, o que pode ser distrativo. | ⚪ Baixo | Micro-interações | `src/app/(dashboard)/layout.module.css:21` |
| 29 | **Import page defaults tudo para EXPENSE** — Na lógica de detecção de tipo de transação importada, ambos os branches (negativo e positivo) resultam em 'EXPENSE' (linha 247). Receitas não serão detectadas automaticamente. | ⚪ Baixo | UX/Usabilidade | `src/app/(dashboard)/import/ImportClient.tsx:243-247` |
| 30 | **Inline styles em formulários de modais** — Alguns modais usam `style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}` diretamente. Deveria ser uma classe CSS reutilizável como `.modal__form`. | ⚪ Baixo | Consistência | `src/app/(dashboard)/categories/CategoriesClient.tsx:115`, `src/app/(dashboard)/budgets/BudgetsClient.tsx:129`, `src/app/(dashboard)/goals/GoalsClient.tsx:159` |
| 31 | **Bundle de 737KB para página de login** — A página de login carrega ~737KB, o que é alto para uma página simples de formulário. Possivelmente dependências do dashboard estão sendo incluídas. | ⚪ Baixo | Performance | Medição do audit de performance |
| 32 | **Card hover com translateY pode ser agressivo** — O efeito `.card:hover { transform: translateY(-2px) }` se aplica a TODOS os cards, incluindo cards de transação na lista, o que pode ser visualmente agitado em listas longas. | ⚪ Baixo | Micro-interações | `src/app/globals.css:229-233` |

## Legenda de Criticidade
- 🔴 **Crítico**: Quebra funcionalidade ou viola padrões de acessibilidade
- 🟠 **Alto**: Impacta significativamente a experiência do usuário ou qualidade do design
- 🟡 **Médio**: Problema visível que deve ser resolvido
- ⚪ **Baixo**: Melhoria desejável

## Pontos Positivos

- ✅ Design system bem estruturado com CSS custom properties abrangentes (cores, espaçamento, sombras, raios, tipografia)
- ✅ Suporte a dark mode completo com transições suaves
- ✅ Boa escolha de fontes (Outfit para display, Inter para corpo)
- ✅ Animações de entrada suaves (scaleIn, slideInUp, countUp)
- ✅ Uso correto de `lang="pt-BR"` no HTML
- ✅ Bons placeholders nos formulários em português
- ✅ Stepper visual bem implementado na página de importação
- ✅ Tela de sucesso da importação é clara e informativa

## Próximos Passos Recomendados

### Prioridade 1 — Acessibilidade (Crítico)
1. Adicionar `<main>` landmark em todas as páginas
2. Substituir emojis por ícones SVG com `aria-hidden` e texto `sr-only`
3. Adicionar `role="dialog"` e focus trap nos modais
4. Adicionar `aria-label` nos botões que usam apenas emojis
5. Adicionar skip navigation link

### Prioridade 2 — Navegação Mobile (Crítico)
1. Implementar menu hamburger ou bottom navigation para mobile
2. Garantir que sidebar seja acessível em telas pequenas

### Prioridade 3 — UX/Performance (Alto)
1. Substituir `window.location.reload()` por `router.refresh()` ou atualização de state
2. Migrar Google Fonts para `next/font`
3. Adicionar botão de logout
4. Conectar seletor de mês com as páginas

### Prioridade 4 — Consistência (Médio)
1. Extrair componentes reutilizáveis: `FilterTabs`, `PageHeader`, `ConfirmDialog`
2. Unificar cores hardcoded usando CSS custom properties
3. Criar classe CSS `.modal__form` reutilizável
