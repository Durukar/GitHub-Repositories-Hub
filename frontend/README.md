# GHH - GitHub Hub 🚀

A modern, minimalist, and blazing-fast web application to manage your GitHub repositories. Engineered with a beautiful Apple-inspired glassmorphism design, it allows you to easily view, filter, and modify the visibility of your GitHub repositories directly from a unified dashboard.

---

## 🌟 Key Features

- **Personal Access Token Integration**: Securely list all your repositories without saving your credentials on any server.
- **Glassmorphism UI**: Beautiful, premium frosted-glass design implemented with Tailwind CSS and Framer Motion.
- **Client-Side Pagination**: Browse repositories instantly without extra API calls or loading screens.
- **Bulk Visibility Toggling**: Change multiple repositories from `Public` to `Private` (or vice-versa) with a single click.
- **Dark Mode Ready**: Ships with a sleek dark theme out of the box using `next-themes`.
- **Responsive Animations**: Fluid enter/exit animations and micro-interactions for a premium feel.

## 🛠 Tech Stack

- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS v4** (Utility-first styling, glassmorphism)
- **Framer Motion** (Animations and transitions)
- **Lucide React** (Beautiful iconography)
- **Shadcn UI & Radix UI** (Accessible, unstyled primitives)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/github-hub.git
   cd github-hub
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### 🔑 How to get your GitHub Token
To use the app, you need a Personal Access Token (classic):
1. Go to GitHub **Settings** > **Developer Settings** > **Personal Access Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Check the `repo` scope box (required for viewing private repos and modifying visibility).
4. Paste the generated token into the application.

---

## 📜 License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for more details.

---

<br>

# GHH - GitHub Hub (Português) 🚀

Uma aplicação web moderna, rápida e minimalista para gerenciar seus repositórios do GitHub. Desenvolvida com um belo design "glassmorphism" inspirado nos painéis da Apple, permitindo visualizar, filtrar e modificar a visibilidade de seus repositórios diretamente de um painel unificado.

## 🌟 Principais Funcionalidades

- **Integração via Personal Access Token**: Liste seus repositórios com segurança, sem salvar credenciais em nenhum servidor.
- **Interface Glassmorphism**: Design premium em vidro fosco usando Tailwind CSS e Framer Motion.
- **Paginação Client-Side**: Navegue instantaneamente sem requisições adicionais de API.
- **Alteração de Visibilidade em Massa**: Mude múltiplos repositórios de `Público` para `Privado` (ou vice-versa) em um só clique.
- **Dark Mode**: Tema escuro lindo e moderno já incluso (via `next-themes`).
- **Animações Fluidas**: Transições de entrada/saída e micro-interações responsivas.

## 🚀 Como Começar

1. Clone o repositório e acesse a pasta:
   ```bash
   git clone https://github.com/your-username/github-hub.git
   cd github-hub
   ```
2. Instale as dependências com `pnpm install` e rode o projeto com `pnpm dev`.
3. Gere um Token no GitHub (marcando a permissão `repo`) e insira no app!

## 📜 Licença

Este projeto está licenciado sob a Apache License 2.0. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
