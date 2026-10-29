# Ensaio do Coro

App de ensaio: apresentações, músicas com BG, voz guia e partitura em PDF.
Os arquivos ficam no Supabase (bucket privado `coro`).

- `index.html`: o app inteiro.
- `supabase.sql`: cria as tabelas e o bucket. Rode uma vez no SQL Editor.

A URL e a chave do Supabase não ficam no código. Cada aparelho é configurado
uma vez, pela tela de conexão ou por um link de configuração.
