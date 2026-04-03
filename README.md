## Getting Started


1. Install dependencies
```bash
npm install
```

2. Create a file named .env in the project root /flatmate, NOT /flatmate/src and add:

> DATABASE_URL="file:./dev.db"

3. Generate the Prisma client
```bash
npx prisma generate
```
4. Apply the database schema
```bash
npx prisma migrate dev
```


Notes
* The database is local and not shared. Each developer has their own dev.db.
* Do not commit dev.db.
* If Prisma schema changes after a future pull, run:
```bash
npx prisma migrate dev
npx prisma generate
```

If something does not work, try:
```bash
rm -rf node_modules .next
npm install
npx prisma generate
npx prisma migrate dev
```

To run the app:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result


To open the Prisma Studio:
```bash
npx prisma studio
```


