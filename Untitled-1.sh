cd ~/sitebooks
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/sitebooks?sslmode=require" npx prisma db push
DATABASE_URL="postgresql://neondb_owner:npg_lvX4ieFITC6j@ep-dry-morning-amg1na4e-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx tsx prisma/seed.ts

DATABASE_URL="postgresql://neondb_owner:npg_lvX4ieFITC6j@ep-dry-morning-amg1na4e-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma db push

