# Sistema de Geração e Gerenciamento de Certificados

Aplicação Next.js (App Router) pronta para deploy no **Vercel**, com:

- **Banco de dados**: PostgreSQL via Prisma
- **Armazenamento de arquivos** (imagens e PDFs): Vercel Blob
- **Geração de PDF**: pdf-lib (gerado no servidor, sem depender de serviços externos)
- **Login simples**: usuário/senha únicos (definidos por variável de ambiente)

## O que já está implementado

- Login e proteção de todas as rotas
- Cursos e Eventos (cadastro)
- Biblioteca de Planos de fundo, Cabeçalhos/logos e Assinaturas (upload de imagem)
- Modelos de certificado: texto com variáveis (`{NOME_ALUNO}`, `{CURSO}`, `{EVENTO}`, `{CARGA_HORARIA}`,
  `{DATA}`, `{LOCAL}`, `{ANO}`, `{INSTITUICAO}`, `{NUMERO_CERTIFICADO}`), posição do nome/logo/assinatura
  (em % da página) e pré-visualização
- Assistente "Nova geração": identificação do lote → escolha do modelo → colar lista de alunos →
  validação (linhas vazias e nomes duplicados) → prévia → geração em lote
- Geração automática de PDF individual por aluno, numeração única (`CERT-{ano}-{sequência}`) e
  criação automática da pasta (lote)
- Área "Certificados": pastas por lote, pesquisa global (aluno, número, curso, evento, turma, ano, pasta)
- Dentro de cada pasta: visualizar, baixar, editar (nome do aluno / carga horária, regera o PDF),
  excluir (vai para a lixeira) e baixar tudo em ZIP
- Lixeira com restaurar / excluir definitivamente (para pastas e certificados)

## O que pode ser adicionado depois (não incluído nesta primeira versão)

- Edição visual por arraste (drag-and-drop) do texto/assinatura/logo — hoje a posição é ajustada por
  campos numéricos (%) com pré-visualização ao vivo
- Importação de planilha (Excel/CSV) — hoje a lista é colada em texto
- Atualização em lote (alterar um campo em todos os certificados de uma pasta de uma vez)
- Histórico detalhado de alterações por certificado
- Múltiplos usuários com permissões diferentes (hoje é um único usuário administrador)
- Página pública de validação de certificado pelo código

## Como colocar no ar sem instalar nada (100% pelo navegador)

Este projeto já está configurado para criar as tabelas do banco de dados automaticamente durante o
deploy (veja o script `build` em `package.json`), então **não é necessário usar terminal, Node.js
nem Git instalados na sua máquina**. Todo o processo pode ser feito pelo site do GitHub e do Vercel.

1. **Crie um repositório no GitHub** (github.com → "+" → "New repository").
2. **Suba os arquivos**: dentro do repositório recém-criado, clique em "uploading an existing file"
   (ou "Add file → Upload files") e arraste a pasta do projeto extraída do ZIP para a página —
   no Chrome ou Edge isso envia todos os arquivos e subpastas de uma vez. Depois clique em "Commit changes".
3. No [vercel.com](https://vercel.com), entre com sua conta do GitHub, clique em **Add New → Project**
   e importe esse repositório.
4. Antes de clicar em Deploy, crie o banco de dados: na tela de import (ou depois, em **Storage**
   dentro do projeto) clique em **Create Database → Postgres**. O Vercel conecta a variável
   `DATABASE_URL` automaticamente.
5. Crie o armazenamento de arquivos: ainda em **Storage → Create Database → Blob**. O Vercel conecta
   a variável `BLOB_READ_WRITE_TOKEN` automaticamente.
6. Em **Settings → Environment Variables**, adicione manualmente:
   - `ADMIN_USER` — usuário de login que você escolher
   - `ADMIN_PASS` — senha de login que você escolher
   - `APP_SECRET` — qualquer texto longo e aleatório
7. Clique em **Deploy**. O Vercel instala tudo e já cria as tabelas do banco sozinho durante o build.
8. Acesse a URL gerada (ex.: `sistema-certificados.vercel.app`) e faça login com o `ADMIN_USER`/`ADMIN_PASS`.

Qualquer alteração futura no código pode ser feita direto pela interface web do GitHub
(abrindo o arquivo → ícone de lápis → editar → "Commit changes"), e o Vercel republica sozinho.

## Como rodar localmente (opcional, só se você tiver Node.js instalado)

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_USER`,
   `ADMIN_PASS` e `APP_SECRET`.
3. `npm run dev` e acesse `http://localhost:3000`.

## Estrutura de pastas

```
app/
  (app)/            → páginas protegidas (menu lateral, certificados, modelos, etc.)
  api/               → rotas de API (cursos, eventos, assets, modelos, lotes, certificados, lixeira)
  login/             → tela de login pública
lib/
  db.ts              → cliente Prisma
  auth.ts            → autenticação por cookie assinado
  pdf.ts             → geração dos PDFs dos certificados
  numero.ts          → geração do número único do certificado
  validacao.ts       → validação da lista de alunos colada
prisma/
  schema.prisma      → modelo do banco de dados
```
