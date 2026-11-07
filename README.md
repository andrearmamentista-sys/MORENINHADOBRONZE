# Moreninha do Bronze - Sistema Completo de Agendamento & Gestão

Aplicativo web moderno para agendamento de sessões de bronzeamento natural, banho de lua e estética corporal, com integração direta ao WhatsApp, pagamentos via PIX oficial (Banco Central) e Painel Administrativo com proteção por senha e auditoria.

---

## 🚀 Como subir este projeto no seu GitHub

Se você já tem um repositório criado no GitHub (por exemplo: `https://github.com/SEU-USUARIO/moreninha-do-bronze.git`), basta rodar no seu terminal os seguintes comandos:

```bash
# 1. Conectar seu repositório remoto do GitHub
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git

# 2. Enviar todos os arquivos e histórico para a branch main
git push -u origin main
```

*(Se você já tiver um remote origin configurado e quiser alterar para um novo, rode: `git remote set-url origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git`)*

---

## ⚡ Como publicar na Vercel sem erros de imagens

O projeto já está 100% preparado para a Vercel com:
1. **`vercel.json` configurado**: Roteamento automático de SPA e entrega prioritária dos arquivos estáticos (`filesystem`).
2. **Pasta `/public/images/`**: Todas as imagens oficiais do salão (banner, logotipo, avatar e fotos dos procedimentos) estão dentro de `public/images/`, garantindo que a Vercel sirva todas sem qualquer erro 404.
3. **Build rápido e otimizado com Vite**: `npm run build` gera a pasta `dist` pronta para CDN mundial.

### Passos na Vercel:
1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **Add New** > **Project**.
3. Selecione o repositório que você enviou.
4. A Vercel detectará automaticamente o framework **Vite**.
5. Clique em **Deploy**. Pronto! O site estará no ar com todas as fotos e links funcionando perfeitamente.

---

## 🔐 Acesso ao Painel do Administrador

- **Usuário:** `abelinha`
- **Senha:** `21976333205`
- **Segurança:**
  - Bloqueio automático de 5 minutos após 5 tentativas incorretas.
  - Botão de limpar campos para facilitar digitação.
  - Debug desligado em produção (sem vazamento de dados ou logs no console).
  - Edição completa de serviços, preços, fotos, endereço, horários de atendimento e dados do PIX.

---

## 💳 Integração PIX (Banco Central do Brasil)

- **Chave Celular:** `21976333205` (padronizada no padrão internacional E.164 do BACEN: `+5521976333205`).
- **Geração de QR Code e Copia e Cola:** Payload oficial EMV com cálculo de CRC16 integrado, compatível com Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, Caixa, PicPay e Mercado Pago.

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** para compilação ultrarrápida
- **Tailwind CSS** para estilização responsiva e efeitos de degrade sem contorno rígido
- **Lucide Icons** para iconografia
- **Vercel Config** para roteamento de alta disponibilidade
