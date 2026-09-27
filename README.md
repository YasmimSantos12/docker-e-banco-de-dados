# API Node.js, Prisma e PostgreSQL

Projeto didatico com uma API REST de usuarios, PostgreSQL em container e Prisma Client. O Docker Compose cria uma rede privada para os servicos e um volume nomeado para manter os dados do banco.

## Executar

1. Copie `.env.example` para `.env` e, se desejar, ajuste as credenciais e a porta.
2. Na pasta do projeto, execute:

   ```powershell
   docker compose up -d --build
   ```

   Na primeira inicializacao, o PostgreSQL fica pronto antes da API. O container da API aplica o schema Prisma com `prisma db push` e entao inicia o servidor.

3. Confira os containers e a conexao com o banco:

   ```powershell
   docker compose ps
   Invoke-RestMethod http://localhost:3000/health
   ```

   A resposta esperada e `status: ok` e `database: connected`.

## CRUD de usuarios

Crie um usuario:

```powershell
$user = Invoke-RestMethod -Method Post -Uri http://localhost:3000/users -ContentType 'application/json' -Body '{"name":"Ana Silva","email":"ana@example.com"}'
$user
```

Liste e consulte:

```powershell
Invoke-RestMethod http://localhost:3000/users
Invoke-RestMethod "http://localhost:3000/users/$($user.id)"
```

Atualize (PUT exige `name` e `email`):

```powershell
Invoke-RestMethod -Method Put -Uri "http://localhost:3000/users/$($user.id)" -ContentType 'application/json' -Body '{"name":"Ana Souza","email":"ana@example.com"}'
```

Remova:

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/users/$($user.id)"
```

Rotas disponiveis: `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id` e `DELETE /users/:id`. O email e unico; duplicatas retornam HTTP 409.

## Encerrar

```powershell
docker compose down
```

Os dados permanecem no volume `postgres_data`. Para apagar tambem os dados persistidos, use `docker compose down -v`.

As credenciais padrao sao apenas para uso local didatico. Nao as utilize em producao.