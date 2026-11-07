# Moreninha do Bronze - Loja & Sistema de Agendamento Completo (Full-Stack)

Aplicativo web completo (Frontend React + Vite + Backend Node.js/Express Serverless) pronto para deploy no **GitHub** e na **Vercel** com persistência permanente de fotos, produtos cadastrados, horários e pagamentos via PIX oficial.

---

## 🌟 Como as Fotos e Produtos Ficam 100% Permanentes na Vercel e no GitHub

Em plataformas serverless como a Vercel, o sistema de arquivos local (`fs`) é temporário e apagado a cada novo deploy ou reinicialização. Para resolver isso e garantir que **nenhum produto ou foto cadastrada suma**:

1. **Persistência Direta no Banco de Dados (PostgreSQL / Supabase / Neon / Vercel Postgres)**:
   - Quando você faz upload de uma foto no painel administrativo, o sistema otimiza a imagem (WebP/JPEG de alta qualidade e tamanho ultra-leve de ~35KB a 60KB).
   - A imagem e todos os dados do produto (nome, preço, descrição, duração) são gravados diretamente nas tabelas permanentes do PostgreSQL (`services`, `salon_config`).
   - Mesmo que a Vercel reinicie 1.000 vezes ou você faça um novo deploy pelo GitHub, **as fotos continuam salvas no banco de dados para sempre**.

2. **Supabase Storage (Opcional - CDN Mundial)**:
   - Se você configurar as credenciais do Supabase no painel administrativo ou nas variáveis de ambiente da Vercel (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`), o sistema faz upload direto para o bucket `salon-images` e gera links CDN de alta velocidade.

3. **Backend Serverless Integrado na Vercel (`api/index.ts`)**:
   - O arquivo `api/index.ts` e o `vercel.json` foram configurados para que todas as rotas `/api/*` (serviços, agendamentos, configurações e uploads) rodem nativamente nas Serverless Functions da Vercel.

---

## 🚀 Passo 1: Como Subir no Seu GitHub

Abra o terminal na pasta do projeto e execute os comandos:

```bash
# 1. Verificar os arquivos alterados
git status

# 2. Adicionar todos os arquivos
git add -A

# 3. Criar o commit
git commit -m "feat: preparar backend e frontend para deploy permanente na Vercel e GitHub"

# 4. Conectar ao seu repositório do GitHub (substitua pelo link do seu repositório)
git remote add origin https://github.com/SEU-USUARIO/moreninha-do-bronze.git

# Caso já exista uma origin cadastrada e queira alterar:
# git remote set-url origin https://github.com/SEU-USUARIO/moreninha-do-bronze.git

# 5. Enviar para o GitHub
git push -u origin main
```

---

## ⚡ Passo 2: Como Publicar na Vercel

1. Acesse **[vercel.com](https://vercel.com)** e faça login com sua conta do GitHub.
2. Clique no botão **"Add New"** > **"Project"**.
3. Selecione o repositório `moreninha-do-bronze` que você acabou de enviar ao GitHub.
4. A Vercel detectará automaticamente as configurações através do arquivo `vercel.json` do projeto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Configurar as Variáveis de Ambiente (Environment Variables)** no painel da Vercel:
   - Vá na seção **Environment Variables** antes de clicar em Deploy e adicione:
     - `DATABASE_URL`: URL de conexão do seu PostgreSQL (ex: Supabase, Neon ou Vercel Postgres).
       *Exemplo Supabase:* `postgresql://postgres.xxxx:sua_senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require`
     - `VITE_SUPABASE_URL`: (opcional) `https://seu-projeto.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: (opcional) Sua chave anônima pública do Supabase
6. Clique no botão azul **"Deploy"**.
7. Pronto! A Vercel publicará tanto o **Frontend** quanto as **Rotas de Backend (`/api`)**.

---

## 🔐 Dados do Painel Administrativo

- **Acesso:** Ícone de engrenagem no canto superior direito.
- **Usuário Padrão:** `abelinha`
- **Senha Padrão:** `21976333205`
- **Recursos Administrativos:**
  - Cadastrar novos produtos/serviços com foto permanente, preço, duração e categoria.
  - Editar serviços existentes ou restaurar os serviços padrão com um clique.
  - Alterar a foto de capa (banner) e foto de perfil/avatar.
  - Alterar horários de funcionamento e capacidade de atendimentos simultâneos.
  - Configurar dados do PIX (Chave, Nome do Titular e Cidade).
  - Personalizar todos os textos de botões do app.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Motion.
- **Backend:** Node.js, Express, Drizzle ORM, PostgreSQL (`pg`), Vercel Serverless Functions (`api/index.ts`).
- **Armazenamento:** PostgreSQL (persistência atômica de produtos) + Supabase Storage CDN.
- **Pagamentos:** Gerador oficial de PIX EMV (BACEN) com CRC16 e QR Code dinâmico.
